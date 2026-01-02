import React, { useEffect, useState } from 'react'
import { apiService } from '../../services/apiService'
import { Users, Mail, FolderOpen, TrendingUp, Activity } from 'lucide-react'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState([
    { name: 'Total Members', value: '-', icon: Users, change: '0%', changeType: 'neutral' },
    { name: 'Active Invitations', value: '-', icon: Mail, change: '0%', changeType: 'neutral' },
    { name: 'Media Files', value: '0', icon: FolderOpen, change: '0%', changeType: 'neutral' },
    { name: 'Growth Rate', value: '0%', icon: TrendingUp, change: '0%', changeType: 'neutral' },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [members, pending] = await Promise.all([
          apiService.admin.getAllUsers(),
          apiService.admin.getPendingUsers()
        ])

        setStats([
          { name: 'Total Members', value: members.length.toString(), icon: Users, change: '+0%', changeType: 'neutral' },
          { name: 'Active Invitations', value: pending.length.toString(), icon: Mail, change: '+0%', changeType: 'neutral' },
          { name: 'Media Files', value: '0', icon: FolderOpen, change: '0%', changeType: 'neutral' },
          { name: 'Growth Rate', value: '0%', icon: TrendingUp, change: '0%', changeType: 'neutral' },
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your organization's key metrics and activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.name}
              </CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                {
                  id: 1,
                  type: 'system',
                  content: 'System initialized successfully.',
                  time: 'Just now',
                  icon: Activity
                }
              ].map((activity) => (
                <div key={activity.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.content}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    <activity.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for Quick Actions or other widgets */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Shortcuts to common tasks will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 