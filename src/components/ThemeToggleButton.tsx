import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeContext } from '../contexts/ThemeContext';

const ThemeToggleButton = () => {
  const { isDarkMode, toggleTheme } = useThemeContext();

  return (
    <Tooltip title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
      <IconButton color="inherit" onClick={toggleTheme} aria-label="toggle-theme">
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;
