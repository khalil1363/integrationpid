import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

const PLATFORM_NAME = 'SlangEnglish';

@Component({
  selector: 'app-certificate-verify',
  templateUrl: './certificate-verify.component.html',
  styleUrls: ['./certificate-verify.component.css']
})
export class CertificateVerifyComponent implements OnInit {
  studentName = '';
  certificateDate = '';
  platformName = PLATFORM_NAME;
  level = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.studentName = params['name'] || 'Certificate Holder';
      this.certificateDate = params['date'] || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      this.level = params['level'] || '';
    });
  }
}
