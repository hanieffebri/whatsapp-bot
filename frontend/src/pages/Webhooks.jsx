import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Checkbox, 
  FormControlLabel, 
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import axios from 'axios'

const eventOptions = [
  'message',
  'message:inbound',
  'message:outbound',
  'message:sent',
  'message:delivered',
  'message:read',
  'message:failed'
]

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentWebhook, setCurrentWebhook] = useState(null)
  const [formData, setFormData] = useState({
    url: '',
    events: [],
    is_active: true
  })

  const fetchWebhooks = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/webhooks')
      setWebhooks(response.data.data.webhooks)
    } catch (error) {
      console.error('Error fetching webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      if (editMode && currentWebhook) {
        await axios.put(`/webhooks/${currentWebhook.id}`, formData)
      } else {
        await axios.post('/webhooks', formData)
      }
      
      setOpenDialog(false)
      fetchWebhooks()
    } catch (error) {
      console.error('Error saving webhook:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      setLoading(true)
      await axios.delete(`/webhooks/${id}`)
      fetchWebhooks()
    } catch (error) {
      console.error('Error deleting webhook:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (webhook) => {
    setCurrentWebhook(webhook)
    setFormData({
      url: webhook.url,
      events: webhook.events,
      is_active: webhook.is_active
    })
    setEditMode(true)
    setOpenDialog(true)
  }

  const handleEventToggle = (event) => {
    setFormData(prev => {
      const newEvents = prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
      return { ...prev, events: newEvents }
    })
  }

  useEffect(() => {
    fetchWebhooks()
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Webhooks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFormData({
              url: '',
              events: [],
              is_active: true
            })
            setEditMode(false)
            setOpenDialog(true)
          }}
        >
          Add Webhook
        </Button>
      </Box>
      
      {loading && !webhooks.length ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>URL</TableCell>
                <TableCell>Events</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>{webhook.url}</TableCell>
                  <TableCell>
                    {webhook.events.map(event => (
                      <Chip key={event} label={event} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    {webhook.is_active ? (
                      <Chip label="Active" color="success" size="small" />
                    ) : (
                      <Chip label="Inactive" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(webhook)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(webhook.id)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Webhook form dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Webhook' : 'Add New Webhook'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Webhook URL"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              fullWidth
              margin="normal"
              placeholder="https://example.com/webhook"
            />
            
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Select Events to Listen For:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
              {eventOptions.map(event => (
                <FormControlLabel
                  key={event}
                  control={
                    <Checkbox
                      checked={formData.events.includes(event)}
                      onChange={() => handleEventToggle(event)}
                    />
                  }
                  label={event}
                />
              ))}
            </Box>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formData.url || formData.events.length === 0}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}