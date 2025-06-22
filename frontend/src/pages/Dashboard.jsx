import { useEffect, useState } from 'react'
import { Box, Typography, Card, CardContent, Grid, CircularProgress } from '@mui/material'
import { Doughnut } from 'react-chartjs-2'
import axios from 'axios'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Dashboard({ messages }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/messages/stats')
        setStats(response.data.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching stats:', error)
        setLoading(false)
      }
    }

    fetchStats()
  }, [messages])

  const messageData = {
    labels: ['Inbound', 'Outbound'],
    datasets: [
      {
        data: [stats?.inbound || 0, stats?.outbound || 0],
        backgroundColor: ['#4e73df', '#1cc88a'],
        hoverBackgroundColor: ['#2e59d9', '#17a673'],
        hoverBorderColor: 'rgba(234, 236, 244, 1)',
      },
    ],
  }

  const statusData = {
    labels: ['Sent', 'Delivered', 'Read', 'Failed'],
    datasets: [
      {
        data: [
          stats?.status_sent || 0,
          stats?.status_delivered || 0,
          stats?.status_read || 0,
          stats?.status_failed || 0,
        ],
        backgroundColor: ['#f6c23e', '#36b9cc', '#1cc88a', '#e74a3b'],
        hoverBackgroundColor: ['#dda20a', '#2c9faf', '#17a673', '#be2617'],
        hoverBorderColor: 'rgba(234, 236, 244, 1)',
      },
    ],
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Message Direction
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut data={messageData} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Message Status
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut data={statusData} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}