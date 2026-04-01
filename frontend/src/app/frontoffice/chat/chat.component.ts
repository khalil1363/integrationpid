import { Component } from '@angular/core';

export interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
  avatar: string;
  isOwn: boolean;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  newMessage: string = '';
  messages: Message[] = [
    {
      id: 1,
      sender: 'Sarah Johnson',
      text: 'Hey everyone! How\'s the Angular course going?',
      time: '10:30 AM',
      avatar: 'https://via.placeholder.com/40x40/667eea/ffffff?text=SJ',
      isOwn: false
    },
    {
      id: 2,
      sender: 'Mike Davis',
      text: 'Going great! Just finished the services module.',
      time: '10:32 AM',
      avatar: 'https://via.placeholder.com/40x40/764ba2/ffffff?text=MD',
      isOwn: false
    },
    {
      id: 3,
      sender: 'You',
      text: 'I\'m working on routing right now. It\'s pretty interesting!',
      time: '10:35 AM',
      avatar: 'https://via.placeholder.com/40x40/4facfe/ffffff?text=ME',
      isOwn: true
    },
    {
      id: 4,
      sender: 'Emily Wilson',
      text: 'Routing is powerful! Wait until you get to guards and resolvers.',
      time: '10:37 AM',
      avatar: 'https://via.placeholder.com/40x40/43e97b/ffffff?text=EW',
      isOwn: false
    }
  ];

  sendMessage() {
    if (this.newMessage.trim()) {
      const newMsg: Message = {
        id: this.messages.length + 1,
        sender: 'You',
        text: this.newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'https://via.placeholder.com/40x40/4facfe/ffffff?text=ME',
        isOwn: true
      };
      
      this.messages.push(newMsg);
      this.newMessage = '';
      
      // Simulate response after a delay
      setTimeout(() => {
        const response: Message = {
          id: this.messages.length + 1,
          sender: 'Bot Assistant',
          text: 'Thanks for your message! This is a demo response.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: 'https://via.placeholder.com/40x40/fa709a/ffffff?text=BOT',
          isOwn: false
        };
        this.messages.push(response);
      }, 1000);
    }
  }
}
