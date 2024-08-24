import { Component, inject, TemplateRef } from '@angular/core';
import { NgbOffcanvas, OffcanvasDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-lexique',
  templateUrl: './lexique.component.html',
  styleUrls: ['./lexique.component.scss']
})
export class LexiqueComponent {
  private offcanvasService = inject(NgbOffcanvas);
	closeResult = '';

  constructor (public dataServ: DataService) {}

	open(content: TemplateRef<any>) {
		this.offcanvasService.open(content, { ariaLabelledBy: 'offcanvas-basic-title' }).result.then(
			(result) => {
				this.closeResult = `Closed with: ${result}`;
			},
			(reason) => {
				this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			},
		);
	}

	private getDismissReason(reason: any): string {
		switch (reason) {
			case OffcanvasDismissReasons.ESC:
				return 'by pressing ESC';
			case OffcanvasDismissReasons.BACKDROP_CLICK:
				return 'by clicking on the backdrop';
			default:
				return `with: ${reason}`;
		}
	}
}
