import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';

// Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Assistants from './pages/Assistants';
import AssistantDetail from './pages/AssistantDetail';
import Integrations from './pages/Integrations';
import KnowledgeBase from './pages/KnowledgeBase';
import CustomFunctions from './pages/CustomFunctions';

const App: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar onMenuToggle={handleDrawerToggle} />
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          ml: { md: '240px' },
        }}
      >
        <Toolbar /> {/* This creates space below the fixed app bar */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assistants" element={<Assistants />} />
          <Route path="/assistants/new" element={<AssistantDetail />} />
          <Route path="/assistants/:id" element={<AssistantDetail />} />
          <Route path="/assistants/:id/edit" element={<AssistantDetail isEdit />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/functions" element={<CustomFunctions />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default App;