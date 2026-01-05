# AI Assistant API Documentation

## Overview

This API allows you to manage AI assistants and their integrations with various platforms like Telegram, WhatsApp (via GreenAPI), and Google Sheets. The API also provides functionality for knowledge base management and custom functions.

## Base URL

```
http://194.110.54.189:8005/
```

## Authentication

Authentication details are not specified in the provided code. Contact the API administrator for authentication information.

## API Endpoints

### Assistant Management

#### Get All Assistants

```
GET /assistants
```

Returns a list of all AI assistants.

**Response**: Array of `AIAssistantModel` objects.

#### Create Assistant

```
POST /ai-config
```

Creates a new AI assistant.

**Request Body**: `AIAssistantModel`

**Response**: The created `AIAssistantModel` object.

#### Get Assistant Configuration

```
GET /ai-config/{assistant_id}
```

Returns the configuration for a specific assistant.

**Parameters**:
- `assistant_id` (path): ID of the assistant

**Response**: `AIAssistantModel` object.

#### Update Assistant (Full)

```
PUT /ai-config/{assistant_id}
```

Updates all fields of an assistant.

**Parameters**:
- `assistant_id` (path): ID of the assistant

**Request Body**: `AIAssistantModel`

**Response**: The updated `AIAssistantModel` object.

#### Update Assistant (Partial)

```
PATCH /ai-config/{assistant_id}
```

Updates specified fields of an assistant.

**Parameters**:
- `assistant_id` (path): ID of the assistant

**Request Body**: `AIAssistantUpdateModel`

**Response**: The updated `AIAssistantModel` object.

#### Update Single Assistant Field

```
PATCH /ai-config/{assistant_id}/{field}
```

Updates a single field of an assistant.

**Parameters**:
- `assistant_id` (path): ID of the assistant
- `field` (path): Field name to update

**Request Body**: Value for the field

**Response**: The updated `AIAssistantModel` object.

### Telegram Integration

#### Get All Telegram Integrations

```
GET /get_all_telegram_integrations
```

Returns all Telegram integrations.

**Response**: Array of Telegram integration objects.

#### Setup Telegram Integration

```
POST /telegram-integration/{bot_token}
```

Creates or updates a Telegram integration.

**Parameters**:
- `bot_token` (path): Telegram bot token

**Request Body**: `TelegramIntegrationModel`

**Response**: Status message.

#### Delete Telegram Integration

```
DELETE /delete_telegram_integration/{integration_id}
```

Deletes a Telegram integration.

**Parameters**:
- `integration_id` (path): ID of the integration

**Response**: Status message.

### WhatsApp Integration (via GreenAPI)

#### Get All WhatsApp Integrations

```
GET /all-greenapi-integrations
```

Returns all WhatsApp integrations.

**Response**: Array of WhatsApp integration objects.

#### Setup WhatsApp Integration

```
POST /greenapi-integration
```

Creates or updates a WhatsApp integration via GreenAPI.

**Request Body**: `GreenAPIIntegrationModel`

**Response**: Status message.

#### Delete WhatsApp Integration

```
DELETE /delete_whatsapp_integration/{integration_id}
```

Deletes a WhatsApp integration.

**Parameters**:
- `integration_id` (path): ID of the integration

**Response**: Status message.

### Google Sheets Integration

#### Get All Google Sheets Integrations

```
GET /get_all_google_sheets_integration
```

Returns all Google Sheets integrations.

**Response**: Array of Google Sheets integration objects.

#### Setup Google Sheets Integration

```
POST /google-sheets-integration
```

Creates or updates a Google Sheets integration.

**Request Body**: `GoogleSheetsIntegrationModel`

**Response**: Status message.

#### Delete Google Sheets Integration

```
DELETE /delete_google_sheets_integration/{integration_id}
```

Deletes a Google Sheets integration.

**Parameters**:
- `integration_id` (path): ID of the integration

**Response**: Status message.

### Knowledge Base

#### Add Text to Knowledge Base

```
POST /knowledge-base/
```

Adds text to the knowledge base.

**Request Body**: `TextData`

**Response**: `TextDataResponse`

#### Get Texts from Knowledge Base

```
GET /knowledge-base/
```

Returns texts from the knowledge base.

**Query Parameters**:
- `skip` (integer, default: 0): Number of items to skip
- `limit` (integer, default: 10, max: 100): Number of items to return
- `assistant_id` (string, optional): Filter by assistant ID

**Response**: Array of `TextDataResponse` objects.

#### Count Texts in Knowledge Base

```
GET /knowledge-base/count
```

Returns the count of texts in the knowledge base.

**Query Parameters**:
- `assistant_id` (string, optional): Filter by assistant ID

**Response**: Object with count.

#### Get Text from Knowledge Base

```
GET /knowledge-base/{text_id}
```

Returns a specific text from the knowledge base.

**Parameters**:
- `text_id` (path): ID of the text

**Response**: `TextDataResponse` object.

#### Update Text in Knowledge Base

```
PUT /knowledge-base/{text_id}
```

Updates text in the knowledge base.

**Parameters**:
- `text_id` (path): ID of the text

**Request Body**: `TextDataUpdate`

**Response**: `TextDataResponse` object.

#### Delete Text from Knowledge Base

```
DELETE /knowledge-base/{text_id}
```

Deletes text from the knowledge base.

**Parameters**:
- `text_id` (path): ID of the text

**Response**: Status message.

#### Search Texts in Knowledge Base

```
POST /knowledge-base/search
```

Searches texts in the knowledge base.

**Request Body**: `SearchQuery`

**Response**: `SearchResponse` object.

### Custom Functions

#### Activate Save User Data Function

```
POST /functions/save_user_data/activate
```

Activates the save_user_data function for an assistant.

**Query Parameters**:
- `assistant_id` (string): ID of the assistant

**Request Body**: Schema of entities to save

**Response**: Status message with function and integration IDs.

#### Update Save User Data Schema

```
PUT /functions/save_user_data/update
```

Updates the schema for the save_user_data function.

**Query Parameters**:
- `assistant_id` (string): ID of the assistant

**Request Body**: Updated schema of entities to save

**Response**: Status message.

#### Delete Entity from Save User Data Schema

```
DELETE /functions/save_user_data/entity/{entity_name}
```

Deletes an entity from the save_user_data schema.

**Parameters**:
- `entity_name` (path): Name of the entity to delete

**Query Parameters**:
- `assistant_id` (string): ID of the assistant

**Response**: Status message.

#### Deactivate Save User Data Function

```
DELETE /functions/save_user_data/deactivate
```

Deactivates the save_user_data function for an assistant.

**Query Parameters**:
- `assistant_id` (string): ID of the assistant

**Response**: Status message.

#### Get Save User Data Schema

```
GET /functions/save_user_data/schema
```

Returns the schema for the save_user_data function.

**Query Parameters**:
- `assistant_id` (string): ID of the assistant

**Response**: Schema information.

## Data Models

### AIAssistantModel

```python
{
    "assistant_id": str,  # Optional, alias="_id"
    "openai_id": str,  # OpenAI API key
    "name": str,
    "model": str,
    "instructions": str,  # Optional
    "temperature": float,  # Default: 0.7
    "functions_on": bool,  # Default: False
    "message_buffer": int,  # Default: 1
    "created_at": datetime,
    "updated_at": datetime,  # Optional
    "hello_message": str,  # Default: "Я готов консультировать!"
    "error_message": str,  # Default: "Извините, не доступен, обратитесь позже."
    "max_tokens": int,  # Default: 2000
    "search_count": int,  # Default: 20
    "truncation_strategy": {
        "type": str,
        "last_messages": int
    },
    "min_relatedness": float  # Default: 0.3
}
```

### AIAssistantUpdateModel

```python
{
    "openai_id": str,  # Optional
    "name": str,  # Optional
    "model": str,  # Optional
    "instructions": str,  # Optional
    "temperature": float,  # Optional
    "functions_on": bool,  # Optional
    "message_buffer": int,  # Optional
    "hello_message": str,  # Optional
    "error_message": str,  # Optional
    "max_tokens": int,  # Optional
    "search_count": int,  # Optional
    "truncation_strategy": {
        "type": str,
        "last_messages": int
    },  # Optional
    "min_relatedness": float  # Optional
}
```

### FunctionModel

```python
{
    "function_id": str,  # Optional, alias="_id"
    "name": str,
    "description": str,
    "parameters": dict,  # Default: {}
    "assistant_id": str
}
```

Example:
```json
{
    "name": "get_weather",
    "description": "Get weather information for a specific location",
    "parameters": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "The city and state, e.g., San Francisco, CA"
            },
            "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "The temperature unit to use"
            }
        },
        "required": ["location"]
    },
    "assistant_id": "000000000000000000000000"
}
```

### TelegramIntegrationModel

```python
{
    "bot_token": str,
    "webhook_url": str,  # Optional
    "assistant_id": str  # Optional
}
```

### GreenAPIIntegrationModel

```python
{
    "instance_id": str,
    "api_token": str,
    "assistant_id": str,  # Optional
    "nums": int  # Default: 7105
}
```

### GoogleSheetsIntegrationModel

```python
{
    "spreadsheet_id": str,
    "credentials_json": dict,
    "assistant_id": str  # Optional
}
```

### TextData

```python
{
    "title": str,
    "content": str,
    "metadata": dict,  # Default: {}
    "assistant_id": str  # Optional
}
```

### TextDataResponse

```python
{
    "id": str,
    "title": str,
    "content": str,
    "metadata": dict,
    "assistant_id": str,  # Optional
    "created_at": datetime,
    "updated_at": datetime  # Optional
}
```

### TextDataUpdate

```python
{
    "title": str,  # Optional
    "content": str,  # Optional
    "metadata": dict,  # Optional
    "assistant_id": str  # Optional
}
```

### SearchQuery

```python
{
    "query": str,
    "filter_by": dict,  # Optional
    "limit": int  # Default: 10
}
```

### SearchResponse

```python
{
    "results": List[TextDataResponse],
    "total": int
}
```

## Save User Data Function Schema

When activating or updating the save_user_data function, you need to provide a schema of entities to save. Each entity has a type and description. The supported types are:

- `string`: String value
- `bool`: Boolean value
- `int`: Integer value
- `float`: Floating-point value
- `dict`: Object/dictionary value

Example schema:
```json
{
    "name": {
        "type": "string",
        "description": "User's full name"
    },
    "age": {
        "type": "int",
        "description": "User's age in years"
    },
    "is_subscribed": {
        "type": "bool",
        "description": "Whether the user is subscribed to the newsletter"
    },
    "preferences": {
        "type": "dict",
        "description": "User's preferences"
    }
}
```