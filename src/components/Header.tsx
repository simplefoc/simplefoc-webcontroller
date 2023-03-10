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
      <AppBar position="static">
        <Toolbar>
            {/* <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
            <MenuIcon /> 
           </IconButton> */}
          <Typography variant="h6"  component="div" sx={{ flexGrow: 1 }}>
            <span className="simplefoc">Simple<span className="foc">FOC</span>WebController</span>
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button href="https://simplefoc.com" sx={{ color: '#fff' }}>
            Home
            </Button>
            <Button href="https://docs.simplefoc.com" sx={{ color: '#fff' }}>
            Docs
            </Button>
            <Button href="https://github.com/simplefoc" sx={{ color: '#fff' }}>
            Github
            </Button>
            <Button href="https://community.simplefoc.com" sx={{ color: '#fff' }}>
            Community
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
