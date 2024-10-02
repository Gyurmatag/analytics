'use client'

import { useState, useEffect } from 'react'
import { init } from '@instantdb/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertCircle, Activity, Clock, Users } from 'lucide-react'

// Initialize InstantDB
const APP_ID = 'c6c36100-8379-4433-b38f-b6e828574a39'

type Schema = {
  logs: Log
}

const db = init<Schema>({ appId: APP_ID })

type Log = {
  id: string
  actionType: string
  createdAt: number
  elementId: string
  elementType: string
  userSessionId: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

export default function Component() {
  const [timeRange, setTimeRange] = useState('1h')
  const { isLoading, error, data } = db.useQuery({ logs: {} })

  const [actionChartData, setActionChartData] = useState([])
  const [sessionChartData, setSessionChartData] = useState([])
  const [latestEvents, setLatestEvents] = useState<Log[]>([])

  useEffect(() => {
    if (data?.logs) {
      const now = Date.now()
      const filteredLogs = data.logs.filter((log: Log) => {
        const logTime = new Date(log.createdAt).getTime()
        if (timeRange === '1h') return now - logTime <= 3600000
        if (timeRange === '24h') return now - logTime <= 86400000
        return true // 'all' time range
      })

      // Prepare action chart data
      const actionCounts = filteredLogs.reduce((acc: Record<string, number>, log: Log) => {
        acc[log.actionType] = (acc[log.actionType] || 0) + 1
        return acc
      }, {})
      setActionChartData(Object.entries(actionCounts).map(([name, value]) => ({ name, value })))

      // Prepare session chart data
      const sessionCounts = filteredLogs.reduce((acc: Record<string, number>, log: Log) => {
        if (log.userSessionId) {
          acc[log.userSessionId] = (acc[log.userSessionId] || 0) + 1
        }
        return acc
      }, {})
      setSessionChartData(Object.entries(sessionCounts).map(([name, value]) => ({ name, value })))

      // Set latest events
      setLatestEvents(filteredLogs.slice(0, 5))
    }
  }, [data, timeRange])

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-gray-600">Loading data...</div>
        </div>
    )
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-red-500 flex items-center">
            <AlertCircle className="mr-2" />
            Error fetching data: {error.message}
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Real-time Analytics Dashboard</h1>

        <div className="mb-4">
          <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border rounded p-2"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Activity className="mr-2" />
              Event Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actionChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="mr-2" />
              User Session Activity
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                    data={sessionChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                >
                  {sessionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="mr-2" />
              Latest Events
            </h2>
            <ul className="space-y-4">
              {latestEvents.map((event) => (
                  <li key={event.id} className="border-b pb-2">
                    <p className="font-medium">{event.actionType} on {event.elementType}</p>
                    <p className="text-sm text-gray-500">
                      Element ID: {event.elementId}
                    </p>
                    <p className="text-sm text-gray-500">
                      User Session: {event.userSessionId || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  )
}
