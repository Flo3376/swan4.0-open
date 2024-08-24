import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LexiqueComponent } from './lexique.component';

describe('LexiqueComponent', () => {
  let component: LexiqueComponent;
  let fixture: ComponentFixture<LexiqueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LexiqueComponent]
    });
    fixture = TestBed.createComponent(LexiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
