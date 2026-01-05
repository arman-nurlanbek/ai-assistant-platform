from fastapi import APIRouter, HTTPException, Body, Depends, Path, Query
from typing import Dict, Any, List, Optional
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def validate_assistant(assistant_id: str, db):
    try:
        assistant = await db.assistants.find_one({"_id": ObjectId(assistant_id)})
        if assistant is None:
            raise HTTPException(status_code=404, detail="Assistant not found")
        return assistant
    except Exception as e:
        logger.error(f"Error validating assistant: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid assistant ID: {str(e)}")

async def validate_google_sheets_integration(assistant_id: str, db):
    try:
        # This is the original way to find the integration
        integration = await db.google_sheets_integrations.find_one({"assistant_id": ObjectId(assistant_id)})
        
        # If not found, try string comparison as backup
        if integration is None:
            integration = await db.google_sheets_integrations.find_one({"assistant_id": assistant_id})
        
        # If still not found, just get the first integration as a fallback
        if integration is None:
            integrations = await db.google_sheets_integrations.find().to_list(None)
            if integrations and len(integrations) > 0:
                integration = integrations[0]
                logger.warning(f"Using fallback integration with ID: {integration.get('_id')}")
        
        if integration is None:
            raise HTTPException(status_code=404, detail="Google Sheets integration not found for this assistant")
        
        return integration
    except Exception as e:
        logger.error(f"Error validating Google Sheets integration: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid Google Sheets integration: {str(e)}")

def create_functions_router(db):
    router = APIRouter(prefix="/functions", tags=["functions"])
    
    @router.post("/save_user_data/activate", status_code=201)
    async def activate_save_user_data(
        assistant_id: str = Query(..., description="The ID of the assistant"),
        schema: Dict[str, Dict[str, Any]] = Body(..., description="Schema of entities to save")
    ):
        """
        Activate save_user_data function for an assistant.
        Requires existing Google Sheets integration.
        """
        try:
            await validate_assistant(assistant_id, db)
            
            # Just check if any Google Sheets integration exists
            integration = await db.google_sheets_integrations.find_one({})
            if not integration:
                raise HTTPException(status_code=404, detail="Google Sheets integration not found in system")
            
            # Validate schema structure
            for entity_name, entity_config in schema.items():
                if "type" not in entity_config:
                    raise HTTPException(status_code=400, detail=f"Entity '{entity_name}' missing 'type' field")
                if entity_config["type"] not in ["string", "bool", "int", "dict", "float"]:
                    raise HTTPException(status_code=400, detail=f"Invalid type for entity '{entity_name}': {entity_config['type']}")
                if "description" not in entity_config:
                    raise HTTPException(status_code=400, detail=f"Entity '{entity_name}' missing 'description' field")
            
            # Check if function already exists
            existing_function = await db.save_user_data_function.find_one({"assistant_id": ObjectId(assistant_id)})
            
            if existing_function:
                raise HTTPException(status_code=400, detail="save_user_data function already activated for this assistant")
            
            # Create function definition
            function_def = {
                "assistant_id": ObjectId(assistant_id),
                "name": "save_user_data",
                "description": "Save user data to the system",
                "schema": schema,
                "created_at": datetime.now(),
                "active": True,
                "integration_id": str(integration["_id"]),  # Store the integration ID
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
            
            # Build OpenAI function parameters based on schema
            for entity_name, entity_config in schema.items():
                entity_type = entity_config["type"]
                
                if entity_type == "string":
                    function_def["parameters"]["properties"][entity_name] = {
                        "type": "string",
                        "description": entity_config["description"]
                    }
                elif entity_type == "bool":
                    function_def["parameters"]["properties"][entity_name] = {
                        "type": "boolean",
                        "description": entity_config["description"]
                    }
                elif entity_type == "int":
                    function_def["parameters"]["properties"][entity_name] = {
                        "type": "integer",
                        "description": entity_config["description"]
                    }
                elif entity_type == "float":
                    function_def["parameters"]["properties"][entity_name] = {
                        "type": "number",
                        "description": entity_config["description"]
                    }
                elif entity_type == "dict":
                    function_def["parameters"]["properties"][entity_name] = {
                        "type": "object",
                        "description": entity_config["description"]
                    }
            
            result = await db.save_user_data_function.insert_one(function_def)
            
            # Also register as a regular function for assistant
            function_for_assistant = {
                "assistant_id": ObjectId(assistant_id),
                "name": "save_user_data",
                "description": "Save user data to the system",
                "parameters": function_def["parameters"],
                "created_at": datetime.now()
            }
            
            await db.functions.insert_one(function_for_assistant)
            
            return {
                "status": "success",
                "message": "save_user_data function activated successfully",
                "function_id": str(result.inserted_id),
                "assistant_id": assistant_id,
                "integration_id": str(integration["_id"])
            }
        
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error activating save_user_data function: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error activating save_user_data function: {str(e)}")
    
    @router.put("/save_user_data/update", status_code=200)
    async def update_save_user_data_schema(
        assistant_id: str = Query(..., description="The ID of the assistant"),
        schema: Dict[str, Dict[str, Any]] = Body(..., description="Updated schema of entities to save")
    ):
        """
        Update the schema for save_user_data function.
        """
        try:
            await validate_assistant(assistant_id, db)
            
            # Find existing function
            existing_function = await db.save_user_data_function.find_one({"assistant_id": ObjectId(assistant_id)})
            
            if not existing_function:
                raise HTTPException(status_code=404, detail="save_user_data function not activated for this assistant")
            
            # Validate updated schema
            for entity_name, entity_config in schema.items():
                if "type" not in entity_config:
                    raise HTTPException(status_code=400, detail=f"Entity '{entity_name}' missing 'type' field")
                if entity_config["type"] not in ["string", "bool", "int", "dict", "float"]:
                    raise HTTPException(status_code=400, detail=f"Invalid type for entity '{entity_name}': {entity_config['type']}")
                if "description" not in entity_config:
                    raise HTTPException(status_code=400, detail=f"Entity '{entity_name}' missing 'description' field")
            
            # Update schema and rebuild parameters
            updated_parameters = {
                "type": "object",
                "properties": {},
                "required": []
            }
            
            for entity_name, entity_config in schema.items():
                entity_type = entity_config["type"]
                
                if entity_type == "string":
                    updated_parameters["properties"][entity_name] = {
                        "type": "string",
                        "description": entity_config["description"]
                    }
                elif entity_type == "bool":
                    updated_parameters["properties"][entity_name] = {
                        "type": "boolean",
                        "description": entity_config["description"]
                    }
                elif entity_type == "int":
                    updated_parameters["properties"][entity_name] = {
                        "type": "integer",
                        "description": entity_config["description"]
                    }
                elif entity_type == "float":
                    updated_parameters["properties"][entity_name] = {
                        "type": "number",
                        "description": entity_config["description"]
                    }
                elif entity_type == "dict":
                    updated_parameters["properties"][entity_name] = {
                        "type": "object",
                        "description": entity_config["description"]
                    }
            
            # Update save_user_data_function
            await db.save_user_data_function.update_one(
                {"assistant_id": ObjectId(assistant_id)},
                {
                    "$set": {
                        "schema": schema,
                        "parameters": updated_parameters,
                        "updated_at": datetime.now()
                    }
                }
            )
            
            # Also update the corresponding function in functions collection
            await db.functions.update_one(
                {"assistant_id": ObjectId(assistant_id), "name": "save_user_data"},
                {
                    "$set": {
                        "parameters": updated_parameters,
                        "updated_at": datetime.now()
                    }
                }
            )
            
            return {
                "status": "success",
                "message": "save_user_data schema updated successfully",
                "assistant_id": assistant_id
            }
        
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error updating save_user_data schema: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error updating save_user_data schema: {str(e)}")
    
    @router.delete("/save_user_data/entity/{entity_name}", status_code=200)
    async def delete_entity_from_schema(
        entity_name: str,
        assistant_id: str = Query(..., description="The ID of the assistant")
    ):
        """
        Delete an entity from the save_user_data schema.
        """
        try:
            await validate_assistant(assistant_id, db)
            
            # Find existing function
            existing_function = await db.save_user_data_function.find_one({"assistant_id": ObjectId(assistant_id)})
            
            if not existing_function:
                raise HTTPException(status_code=404, detail="save_user_data function not activated for this assistant")
            
            # Check if entity exists in schema
            if entity_name not in existing_function["schema"]:
                raise HTTPException(status_code=404, detail=f"Entity '{entity_name}' not found in schema")
            
            # Remove entity from schema
            updated_schema = existing_function["schema"].copy()
            updated_schema.pop(entity_name)
            
            # Rebuild parameters without the deleted entity
            updated_parameters = existing_function["parameters"].copy()
            if entity_name in updated_parameters["properties"]:
                updated_parameters["properties"].pop(entity_name)
            
            # Update save_user_data_function
            await db.save_user_data_function.update_one(
                {"assistant_id": ObjectId(assistant_id)},
                {
                    "$set": {
                        "schema": updated_schema,
                        "parameters": updated_parameters,
                        "updated_at": datetime.now()
                    }
                }
            )
            
            # Also update the corresponding function in functions collection
            await db.functions.update_one(
                {"assistant_id": ObjectId(assistant_id), "name": "save_user_data"},
                {
                    "$set": {
                        "parameters": updated_parameters,
                        "updated_at": datetime.now()
                    }
                }
            )
            
            return {
                "status": "success",
                "message": f"Entity '{entity_name}' deleted successfully",
                "assistant_id": assistant_id
            }
        
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error deleting entity from save_user_data schema: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error deleting entity: {str(e)}")
    
    @router.delete("/save_user_data/deactivate", status_code=200)
    async def deactivate_save_user_data(
        assistant_id: str = Query(..., description="The ID of the assistant")
    ):
        """
        Deactivate the save_user_data function for an assistant.
        """
        try:
            await validate_assistant(assistant_id, db)
            
            # Find and delete save_user_data_function
            result = await db.save_user_data_function.delete_one({"assistant_id": ObjectId(assistant_id)})
            
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="save_user_data function not activated for this assistant")
            
            # Also delete corresponding function from functions collection
            await db.functions.delete_one({"assistant_id": ObjectId(assistant_id), "name": "save_user_data"})
            
            return {
                "status": "success",
                "message": "save_user_data function deactivated successfully",
                "assistant_id": assistant_id
            }
        
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error deactivating save_user_data function: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error deactivating function: {str(e)}")
    
    @router.get("/save_user_data/schema", status_code=200)
    async def get_save_user_data_schema(
        assistant_id: str = Query(..., description="The ID of the assistant")
    ):
        """
        Get the schema for save_user_data function.
        """
        try:
            await validate_assistant(assistant_id, db)
            
            # Find existing function
            existing_function = await db.save_user_data_function.find_one({"assistant_id": ObjectId(assistant_id)})
            
            if not existing_function:
                raise HTTPException(status_code=404, detail="save_user_data function not activated for this assistant")
            
            return {
                "assistant_id": assistant_id,
                "name": "save_user_data",
                "schema": existing_function["schema"],
                "created_at": existing_function.get("created_at"),
                "updated_at": existing_function.get("updated_at")
            }
        
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error getting save_user_data schema: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error getting schema: {str(e)}")
    
    return router