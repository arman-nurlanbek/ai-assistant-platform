import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { AIAssistant } from '../../types/assistant';
import { Link, useNavigate } from 'react-router-dom';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface AssistantCardProps {
  assistant: AIAssistant;
  onDelete?: (id: string) => void;
}

const AssistantCard: React.FC<AssistantCardProps> = ({ assistant, onDelete }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/assistants/${assistant.assistant_id}/edit`);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (onDelete && assistant.assistant_id) {
      onDelete(assistant.assistant_id);
    }
    handleMenuClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
      }
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5" component="div" gutterBottom noWrap>
              {assistant.name}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {assistant.instructions ? 
            (assistant.instructions.length > 120 
              ? assistant.instructions.substring(0, 120) + '...' 
              : assistant.instructions) 
            : 'No instructions provided'}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip 
            label={assistant.model} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`Temp: ${assistant.temperature}`} 
            size="small" 
            color="secondary" 
            variant="outlined" 
          />
          {assistant.functions_on && (
            <Chip 
              label="Functions" 
              size="small" 
              color="success" 
              variant="outlined" 
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary">
          Created: {formatDate(assistant.created_at)}
        </Typography>
      </CardContent>
      
      <CardActions>
        <Button 
          component={Link} 
          to={`/assistants/${assistant.assistant_id}`} 
          size="small" 
          color="primary"
        >
          View Details
        </Button>
        <Tooltip title="Copy Assistant ID">
          <Button 
            size="small" 
            onClick={() => navigator.clipboard.writeText(assistant.assistant_id || '')}
          >
            Copy ID
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default AssistantCard;