import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent {
  showIcon = false;

  constructor(public auth: AuthService) {
  }

  onImageError() {
    this.showIcon = true;
  }
}
