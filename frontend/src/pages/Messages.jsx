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
  TextField, 
  Button, 
  IconButton, 
  MenuItem, 
  Select, 
  Pagination, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  CircularProgress
} from '@mui/material'
import { 
  Send as SendIcon, 
  AttachFile as AttachFileIcon, 
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import axios from 'axios'

const statusIcons = {
  sent: <CheckCircleIcon color="info" />,
  delivered: <LocalShippingIcon color="primary" />,
  read: <DoneAllIcon color="success" />,
  failed: <ErrorIcon color="error" />
}

export default function Messages({ messages, setMessages }) {
  const [newMessage, setNewMessage] = useState('')
  const [toNumber, setToNumber] = useState('')
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const rowsPerPage = 10
  const filteredMessages = messages.filter(msg => 
    filter === 'all' || msg.direction === filter
  )
  const paginatedMessages = filteredMessages.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/messages')
      setMessages(response.data.data.messages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!toNumber || (!newMessage && !file)) return

    try {
      setLoading(true)
      
      let response
      if (file) {
        const formData = new FormData()
        formData.append('to', toNumber)
        formData.append('file', file)
        if (newMessage) formData.append('caption', newMessage)
        
        response = await axios.post('/messages/send-media', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        response = await axios.post('/messages/send', {
          to: toNumber,
          message: newMessage
        })
      }

      setMessages(prev => [response.data.data.message, ...prev])
      setNewMessage('')
      setToNumber('')
      setFile(null)
      setFileName('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      
      {/* Message composer */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
        <TextField
          label="To (Phone Number)"
          value={toNumber}
          onChange={(e) => setToNumber(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="e.g. 6281234567890"
        />
        <TextField
          label="Message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={3}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <input
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload">
            <Button 
              variant="outlined" 
              component="span" 
              startIcon={<AttachFileIcon />}
            >
              Attach File
            </Button>
          </label>
          {fileName && (
            <Typography variant="body2" sx={{ ml: 2 }}>
              {fileName}
            </Typography>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={loading || (!toNumber || (!newMessage && !file))}
          >
            Send
          </Button>
        </Box>
      </Box>
      
      {/* Message filter and refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            size="small"
            sx={{ mr: 2 }}
          >
            <MenuItem value="all">All Messages</MenuItem>
            <MenuItem value="inbound">Inbound</MenuItem>
            <MenuItem value="outbound">Outbound</MenuItem>
          </Select>
        </Box>
        <IconButton onClick={fetchMessages} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {/* Messages table */}
      {loading && !paginatedMessages.length ? (
        <CircularProgress />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>From/To</TableCell>
                  <TableCell>Content</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Direction</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      {new Date(message.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {message.direction === 'inbound' 
                        ? message.from_number 
                        : message.to_number}
                    </TableCell>
                    <TableCell>
                      {message.content}
                      {message.media_url && (
                        <>
                          <br />
                          <Button 
                            size="small" 
                            onClick={() => {
                              setSelectedFile(message.media_url)
                              setOpenDialog(true)
                            }}
                          >
                            View Attachment
                          </Button>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      {statusIcons[message.status] || message.status}
                    </TableCell>
                    <TableCell>
                      {message.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Pagination
            count={Math.ceil(filteredMessages.length / rowsPerPage)}
            page={page}
            onChange={(e, value) => setPage(value)}
            sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
          />
        </>
      )}
      
      {/* File preview dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md">
        <DialogTitle>Attachment Preview</DialogTitle>
        <DialogContent>
          {selectedFile && (
            selectedFile.endsWith('.pdf') ? (
              <embed 
                src={selectedFile} 
                type="application/pdf" 
                width="100%" 
                height="500px" 
              />
            ) : (
              <img 
                src={selectedFile} 
                alt="Attachment" 
                style={{ maxWidth: '100%', maxHeight: '500px' }} 
              />
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}