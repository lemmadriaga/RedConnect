import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReportService } from 'src/app/report.service';
import { OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/authentication.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit {
  report = { title: '', description: '' };
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  lastSolvedReportMessage: string | null = null;


  constructor(private reportService: ReportService, private router: Router, private authService: AuthenticationService) {}
  ngOnInit() {
    this.checkLastSolvedReport();
  }
  goBack() {
    this.router.navigate(['/student-dashboard/profile']);
  }

  selectImage() {
    const fileInput = document.getElementById('fileInput') as HTMLElement;
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async submitReport() {
    if (this.report.title && this.report.description) {
      try {
        await this.reportService.createReport(this.report, this.selectedFile);
        alert('Report submitted successfully!');
        this.router.navigate(['/student-dashboard/profile']);
      } catch (error) {
        console.error('Error submitting report:', error);
        alert('There was an error submitting your report. Please try again.');
      }
    } else {
      alert('Please fill out the title and description.');
    }
  }

  checkLastSolvedReport() {
    this.authService.getCurrentUserId().then((userId) => {
      this.reportService.getReports().subscribe((reports) => {
        const userReports = reports.filter((report) => report.userId === userId);
        const lastSolved = userReports.find(report => report.userNotified);
        if (lastSolved) {
          this.lastSolvedReportMessage = "Your last report has been solved, thank you!";
        }
      });
    });
  }
  
}
