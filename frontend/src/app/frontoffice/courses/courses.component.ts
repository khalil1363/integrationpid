import { Component } from '@angular/core';

export interface Course {
  id: number;
  title: string;
  image: string;
}

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent {
  courses: Course[] = [
    {
      id: 1,
      title: 'Introduction to Angular',
      image: 'https://via.placeholder.com/300x200/667eea/ffffff?text=Angular'
    },
    {
      id: 2,
      title: 'Advanced CSS Techniques',
      image: 'https://via.placeholder.com/300x200/764ba2/ffffff?text=CSS'
    },
    {
      id: 3,
      title: 'JavaScript Fundamentals',
      image: 'https://via.placeholder.com/300x200/f093fb/ffffff?text=JavaScript'
    },
    {
      id: 4,
      title: 'React Development',
      image: 'https://via.placeholder.com/300x200/4facfe/ffffff?text=React'
    },
    {
      id: 5,
      title: 'Node.js Backend',
      image: 'https://via.placeholder.com/300x200/43e97b/ffffff?text=Node.js'
    },
    {
      id: 6,
      title: 'Python for Data Science',
      image: 'https://via.placeholder.com/300x200/ff9800/ffffff?text=Python'
    },
    {
      id: 7,
      title: 'Vue.js Complete Guide',
      image: 'https://via.placeholder.com/300x200/4caf50/ffffff?text=Vue.js'
    },
    {
      id: 8,
      title: 'TypeScript Essentials',
      image: 'https://via.placeholder.com/300x200/fa709a/ffffff?text=TypeScript'
    }
  ];

  viewDetails(course: Course): void {
    console.log('View course:', course);
  }
}
