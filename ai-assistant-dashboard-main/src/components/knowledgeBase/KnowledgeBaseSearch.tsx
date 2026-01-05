import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { SearchQuery, TextDataResponse } from '../../types/knowledgeBase';
import { AIAssistant } from '../../types/assistant';
import Loader from '../common/Loader';

interface KnowledgeBaseSearchProps {
  assistants: AIAssistant[];
  onSearch: (query: SearchQuery) => Promise<TextDataResponse[]>;
}

const KnowledgeBaseSearch: React.FC<KnowledgeBaseSearchProps> = ({
  assistants,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assistantId, setAssistantId] = useState<string>('');
  const [limit, setLimit] = useState<number>(10);
  const [results, setResults] = useState<TextDataResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAssistantChange = (e: SelectChangeEvent) => {
    setAssistantId(e.target.value);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(Number(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    setIsLoading(true);
    setResults([]);

    try {
      const query: SearchQuery = {
        query: searchQuery,
        limit: limit,
      };
      
      if (assistantId) {
        query.filter_by = { assistant_id: assistantId };
      }
      
      const searchResults = await onSearch(query);
      setResults(searchResults);
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Search Knowledge Base
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Search Query"
                value={searchQuery}
                onChange={handleSearchQueryChange}
                placeholder="Enter your search terms"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Assistant</InputLabel>
                <Select
                  value={assistantId}
                  onChange={handleAssistantChange}
                  label="Filter by Assistant"
                >
                  <MenuItem value="">
                    <em>All Assistants</em>
                  </MenuItem>
                  {assistants.map((assistant) => (
                    <MenuItem key={assistant.assistant_id} value={assistant.assistant_id}>
                      {assistant.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Result Limit"
                type="number"
                value={limit}
                onChange={handleLimitChange}
                InputProps={{ inputProps: { min: 1, max: 50 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={1}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading || !searchQuery.trim()}
                sx={{ height: '56px' }}
              >
                <SearchIcon />
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {isLoading ? (
        <Loader message="Searching knowledge base..." />
      ) : (
        <>
          {hasSearched && (
            <Typography variant="h6" gutterBottom>
              Search Results ({results.length})
            </Typography>
          )}
          
          {results.length === 0 && hasSearched ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No results found for your search query
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {results.map((result) => (
                <Grid item xs={12} key={result.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {result.title}
                        </Typography>
                        <Tooltip title="Copy Content">
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(result.content)}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                        {result.content.length > 300
                          ? `${result.content.substring(0, 300)}...`
                          : result.content}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          {result.assistant_id ? (
                            <Chip 
                              label={assistants.find(a => a.assistant_id === result.assistant_id)?.name || 'Unknown Assistant'} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                              sx={{ mr: 1 }}
                            />
                          ) : (
                            <Chip 
                              label="Global Knowledge" 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                              sx={{ mr: 1 }}
                            />
                          )}
                          
                          {result.metadata && Object.keys(result.metadata).length > 0 && (
                            Object.entries(result.metadata).map(([key, value]) => (
                              <Tooltip title={`${key}: ${value}`} key={key}>
                                <Chip 
                                  label={`${key}: ${value}`} 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                />
                              </Tooltip>
                            ))
                          )}
                        </Box>
                        
                        <Typography variant="caption" color="textSecondary">
                          Created: {formatDate(result.created_at)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default KnowledgeBaseSearch;