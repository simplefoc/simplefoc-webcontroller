import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";

export default function Header(props: any) {
  return (
    <Box sx={{ flexGrow: 1 }} {...props}>
      <AppBar 
        position="static"
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Toolbar sx={{ py: 1.5 }}>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            <span className="simplefoc">Simple<span className="foc">FOC</span></span>
            <span style={{ marginLeft: 8, fontWeight: 500, fontSize: "0.9em" }}>Web Controller</span>
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            <Button 
              href="https://simplefoc.com" 
              sx={{ 
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              Home
            </Button>
            <Button 
              href="https://docs.simplefoc.com/webcontroller" 
              sx={{ 
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              Docs
            </Button>
            <Button 
              href="https://github.com/simplefoc" 
              sx={{ 
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              Github
            </Button>
            <Button 
              href="https://community.simplefoc.com" 
              sx={{ 
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              Community
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
