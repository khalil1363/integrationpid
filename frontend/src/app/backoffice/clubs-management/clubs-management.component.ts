import { Component, OnInit } from '@angular/core';

export interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  members: number;
  leader: string;
  status: 'active' | 'inactive' | 'pending';
  image: string;
  createdAt: string;
}

@Component({
  selector: 'app-clubs-management',
  templateUrl: './clubs-management.component.html',
  styleUrls: ['./clubs-management.component.css']
})
export class ClubsManagementComponent implements OnInit {
  clubs: Club[] = [
    {
      id: 1,
      name: 'Web Developers Club',
      description: 'A community for web development enthusiasts to share knowledge and collaborate on projects.',
      category: 'Technology',
      members: 324,
      leader: 'John Smith',
      status: 'active',
      image: 'https://via.placeholder.com/100x100/667eea/ffffff?text=WD',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'Data Science Guild',
      description: 'Exploring the world of data analytics, machine learning, and artificial intelligence.',
      category: 'Technology',
      members: 256,
      leader: 'Sarah Johnson',
      status: 'active',
      image: 'https://via.placeholder.com/100x100/4caf50/ffffff?text=DS',
      createdAt: '2023-11-20'
    },
    {
      id: 3,
      name: 'UI/UX Design Circle',
      description: 'For designers passionate about creating beautiful and user-friendly interfaces.',
      category: 'Design',
      members: 189,
      leader: 'Emily Wilson',
      status: 'active',
      image: 'https://via.placeholder.com/100x100/9c27b0/ffffff?text=UX',
      createdAt: '2023-09-10'
    },
    {
      id: 4,
      name: 'Mobile Dev Community',
      description: 'Building amazing mobile applications for iOS and Android platforms.',
      category: 'Technology',
      members: 145,
      leader: 'Mike Davis',
      status: 'pending',
      image: 'https://via.placeholder.com/100x100/ff9800/ffffff?text=MD',
      createdAt: '2024-02-01'
    },
    {
      id: 5,
      name: 'Cyber Security Team',
      description: 'Learning about ethical hacking, security protocols, and protecting digital assets.',
      category: 'Security',
      members: 98,
      leader: 'David Brown',
      status: 'active',
      image: 'https://via.placeholder.com/100x100/f44336/ffffff?text=CS',
      createdAt: '2023-08-15'
    },
    {
      id: 6,
      name: 'Game Development Hub',
      description: 'Creating games and exploring game design principles together.',
      category: 'Gaming',
      members: 167,
      leader: 'Lisa Anderson',
      status: 'inactive',
      image: 'https://via.placeholder.com/100x100/2196f3/ffffff?text=GD',
      createdAt: '2023-07-01'
    }
  ];

  filteredClubs: Club[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedStatus: string = 'all';

  ngOnInit(): void {
    this.filteredClubs = [...this.clubs];
  }

  get activeCount(): number {
    return this.clubs.filter(c => c.status === 'active').length;
  }

  get pendingCount(): number {
    return this.clubs.filter(c => c.status === 'pending').length;
  }

  get totalMembers(): number {
    return this.clubs.reduce((sum, c) => sum + c.members, 0);
  }

  filterClubs(): void {
    this.filteredClubs = this.clubs.filter(club => {
      const matchesSearch = this.searchTerm === '' || 
        club.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        club.leader.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = this.selectedCategory === 'all' || club.category === this.selectedCategory;
      const matchesStatus = this.selectedStatus === 'all' || club.status === this.selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  onSearch(): void {
    this.filterClubs();
  }

  onCategoryChange(): void {
    this.filterClubs();
  }

  onStatusChange(): void {
    this.filterClubs();
  }

  getStatusClass(status: string): string {
    return `status-badge ${status}`;
  }

  editClub(club: Club): void {
    console.log('Edit club:', club);
  }

  deleteClub(club: Club): void {
    console.log('Delete club:', club);
  }

  viewClub(club: Club): void {
    console.log('View club:', club);
  }

  addClub(): void {
    console.log('Add new club');
  }
}
