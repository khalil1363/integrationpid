import { Component } from '@angular/core';

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  color: string;
}

interface RecentActivity {
  id: number;
  action: string;
  user: string;
  time: string;
  type: 'user' | 'course' | 'club' | 'system';
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  stats: StatCard[] = [
    {
      title: 'Total Users',
      value: '12,458',
      icon: 'people',
      change: 12.5,
      changeType: 'positive',
      color: 'blue'
    },
    {
      title: 'Active Courses',
      value: '156',
      icon: 'school',
      change: 8.2,
      changeType: 'positive',
      color: 'green'
    },
    {
      title: 'Active Clubs',
      value: '48',
      icon: 'groups',
      change: -2.4,
      changeType: 'negative',
      color: 'purple'
    },
    {
      title: 'Revenue',
      value: '$84,230',
      icon: 'attach_money',
      change: 15.8,
      changeType: 'positive',
      color: 'orange'
    }
  ];

  recentActivities: RecentActivity[] = [
    { id: 1, action: 'New user registered', user: 'John Smith', time: '5 minutes ago', type: 'user' },
    { id: 2, action: 'Course published', user: 'Sarah Johnson', time: '12 minutes ago', type: 'course' },
    { id: 3, action: 'Club created', user: 'Mike Davis', time: '25 minutes ago', type: 'club' },
    { id: 4, action: 'System backup completed', user: 'System', time: '1 hour ago', type: 'system' },
    { id: 5, action: 'New user registered', user: 'Emily Wilson', time: '2 hours ago', type: 'user' },
    { id: 6, action: 'Course updated', user: 'David Brown', time: '3 hours ago', type: 'course' }
  ];

  topCourses = [
    { name: 'Introduction to Angular', students: 1250, rating: 4.8, progress: 92 },
    { name: 'Advanced CSS Techniques', students: 890, rating: 4.7, progress: 85 },
    { name: 'JavaScript Fundamentals', students: 2100, rating: 4.9, progress: 98 },
    { name: 'React Development', students: 1560, rating: 4.6, progress: 78 },
    { name: 'Node.js Backend', students: 980, rating: 4.5, progress: 72 }
  ];

  getActivityIcon(type: string): string {
    switch (type) {
      case 'user': return 'person_add';
      case 'course': return 'school';
      case 'club': return 'groups';
      case 'system': return 'settings';
      default: return 'info';
    }
  }

  getActivityIconClass(type: string): string {
    return `activity-icon ${type}`;
  }
}
