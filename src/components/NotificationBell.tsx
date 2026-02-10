import NotificationsIcon from '@mui/icons-material/Notifications';
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Stack,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, getUnreadCount, markAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const unreadCount = getUnreadCount();
  const latestNotifications = useMemo(() => notifications.slice(0, 10), [notifications]);

  return (
    <>
      <IconButton color="inherit" onClick={(event) => setAnchorEl(event.currentTarget)} aria-label="notificaciones">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: 360, maxWidth: '90vw' }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography fontWeight={700}>Notificaciones</Typography>
          </Box>
          <Divider />

          <List dense sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {latestNotifications.length ? (
              latestNotifications.map((item) => (
                <ListItem key={item.id} alignItems="flex-start" secondaryAction={
                  !item.read && item.id ? (
                    <Button size="small" onClick={() => void markAsRead(item.id!)}>
                      Marcar leída
                    </Button>
                  ) : undefined
                }>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={item.read ? 500 : 700} variant="body2">
                          {item.title}
                        </Typography>
                        {!item.read ? <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} /> : null}
                      </Stack>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary">
                          {item.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(item.timestamp).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No hay notificaciones." />
              </ListItem>
            )}
          </List>

          <Divider />
          <Box sx={{ p: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setAnchorEl(null);
                navigate('/notificaciones');
              }}
            >
              Ver todas
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
