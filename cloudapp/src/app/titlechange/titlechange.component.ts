import { Component, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../app.service';
import { Subscription } from 'rxjs';
import { CloudAppEventsService, PageInfo, Entity, EntityType, CloudAppRestService, AlertService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { Bib, BibUtils } from '../pmcforthcoming/bib-utils';
import { DatePipe } from '@angular/common';
import { ReturnStatement } from '@angular/compiler';


@Component({
    selector: 'app-titlechange',
    templateUrl: './titlechange.component.html',
    styleUrls: ['./titlechange.component.scss'],
  })

  export class TitlechangeComponent implements OnInit {
    count = 0;
    formVisible = false;
    previousTitle: Entity;
    currentTitle: Entity;
    selectedMmsId: string;
    yearCeased: string;
    ceasedDetails: string;
    prevContinuationType: string;
    newContinuationType: string;

    private bibUtils: BibUtils;
    bib: Bib |null =null;
    private _restService: CloudAppRestService;
    
    @ViewChild('selectEntities', { static: false }) selectEntities!: TitlechangeComponent;
  
    constructor(
      private appService: AppService,
      private alertService: AlertService,
      private datePipe: DatePipe,
      private restService: CloudAppRestService) {
        this._restService = restService;
      } 

    ngOnInit() {
      this.appService.setTitle('Select Titles');
    }  
    
    selectedEntities = new Array<Entity>();    
    
    clear() {
    this.selectEntities.clear();
    }
    
    showForm() {
      if (this.selectedEntities.length !== 2) {
        this.alertService.clear();
        this.alertService.error('Please select exactly two records.');
        return;
      }
      this.alertService.clear();
      this.formVisible = true;
    }
  
    goBack() {
      this.alertService.clear();
      this.formVisible = false;    
      console.log(this.formVisible);
    }
    onTitleSelectionChange(){
      this.previousTitle = this.selectedEntities.find(
        e => e.id === this.selectedMmsId 
      );
      this.currentTitle = this.selectedEntities.find(
        e => e.id !== this.selectedMmsId 
      );
      console.log("Previous Title:", this.previousTitle,"Current Title", this.currentTitle);
    }
   
    submitForm() {
      if (!this.previousTitle) {
        this.alertService.error('Please complete all fields');
        return;
      }
      this.alertService.clear();
      if (!confirm(`Are you sure you want to make changes to these records?`)) return;
      const formData = {
        previousTitle: this.previousTitle.id,
        currentTitle: this.currentTitle.id,
        yearCeased: this.yearCeased,
        ceasedDetails: this.ceasedDetails,
        prevContinuationType: this.prevContinuationType,
        newContinuationType: this.newContinuationType
      };

  // Get Current Title
      this.getBib(formData.currentTitle).subscribe(currBib => {
        const doc = new DOMParser().parseFromString(currBib.anies, "application/xml");
        const currentField245a = doc.querySelector('datafield[tag="245"] subfield[code="a"]')?.textContent?.trim();
        const currentField022a = doc.querySelector('datafield[tag="022"] subfield[code="a"]')?.textContent?.trim();
        const currentField010a = doc.querySelector('datafield[tag="010"] subfield[code="a"]')?.textContent?.trim();
        const currentField0359 = doc.querySelector('datafield[tag="035"] subfield[code="9"]')?.textContent?.trim();
        const currentfield035aOCLC = doc.querySelector('datafield[tag="035"] subfield[code="a"]');
        const currentField035a = currentfield035aOCLC && currentfield035aOCLC.textContent.includes("(OCoLC)")? currentfield035aOCLC.textContent.trim() : undefined;

        const currentTitleFields = {
          currentField245a,
          currentField022a,
          currentField010a,
          currentField035a,
          currentField0359
        };
        //console.log("Current Title Fields: ", currentTitleFields);

        // Get Previous Title
        this.getBib(formData.previousTitle).subscribe(prevBib => {
          const doc = new DOMParser().parseFromString(prevBib.anies, "application/xml");
          const prevField245a = doc.querySelector('datafield[tag="245"] subfield[code="a"]')?.textContent?.trim();
          const prevField022a = doc.querySelector('datafield[tag="022"] subfield[code="a"]')?.textContent?.trim();
          const prevField010a = doc.querySelector('datafield[tag="010"] subfield[code="a"]')?.textContent?.trim();
          const prevField0359 = doc.querySelector('datafield[tag="035"] subfield[code="9"]')?.textContent?.trim();
          const field035aOCLC = doc.querySelector('datafield[tag="035"] subfield[code="a"]');
          const prevField035a = field035aOCLC && field035aOCLC.textContent.includes("(OCoLC)")? field035aOCLC.textContent.trim() : undefined;
          const previousTitleFields = {
            prevField245a,
            prevField022a,
            prevField010a,
            prevField035a,
            prevField0359           
          };
          //console.log("Previous Title Fields: ", previousTitleFields);

          const updatedPrev = this.updateprevBib(prevBib, currentTitleFields);
          this.updateBib(updatedPrev).subscribe(() => {
          //  console.log("Previous BIB updated");
          });

          const updatedNew = this.updatenewBib(currBib, previousTitleFields);
          this.updateBib(updatedNew).subscribe(() => {
          //  console.log("Current BIB updated");
          });
        });
    });
    this.alertService.success("Reload both records to verify changes.")
  }
    
    // Retrieve a single BIB record 
  getBib (mmsId: string) {
    return this._restService.call<Bib>(`/bibs/${mmsId}`);
  }  

  // Update a BIB record with the specified MARCXML 
  updateBib( bib: Bib ) {
    return this._restService.call<Bib>( {
      url: `/bibs/${bib.mms_id}`,
      headers: { 
        "Content-Type": "application/xml",
        Accept: "application/json" },
      requestBody: `<bib>${bib.anies}</bib>`,
      method: HttpMethod.PUT
    });
  }
  
  
    // update new bib
    updatenewBib(bib: Bib, previousTitleFields) {
        const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
        
        if (previousTitleFields?.prevField245a) {
          // Remove any existing 780 field
          const existing780 = doc.querySelectorAll('datafield[tag="780"]');
          existing780.forEach(el => el.remove());
        
        if (previousTitleFields?.prevField245a) {
          const datafield780 = dom("datafield", {
            parent: doc.documentElement,
            attributes: [["tag", "780"], ["ind1", "0"], ["ind2", this.newContinuationType]]
          });
      
          dom("subfield", {
            parent: datafield780,
            text: previousTitleFields.prevField245a,
            attributes: [["code", "t"]]
          });
          if (previousTitleFields?.prevField022a){
            dom("subfield", {
              parent: datafield780,
              text: previousTitleFields.prevField022a,
              attributes: [["code", "x"]]
            });
          }
          if (previousTitleFields?.prevField010a){
            dom("subfield", {
              parent: datafield780,
              text: previousTitleFields.prevField010a,
              attributes: [["code", "w"]]
            });
          }
          if (previousTitleFields?.prevField035a){
            dom("subfield", {
              parent: datafield780,
              text: previousTitleFields.prevField035a,
              attributes: [["code", "w"]]
            });
          }
          dom("subfield", {
            parent: datafield780,
            text: previousTitleFields.prevField0359,
            attributes: [["code", "w"]]
          });
        };
      }
       
      bib.anies = new XMLSerializer().serializeToString(doc.documentElement);
      return bib;
    }

     // update previous bib
     updateprevBib(bib: Bib, currentTitleFields) {
        
      //Get date
        const currentDate = this.datePipe.transform(new Date(), 'YYYYMMdd');

        const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
        
        //Update 008 6 to d
        const field008 = doc.querySelector('controlfield[tag="008"]');
        if (field008 && field008.textContent && field008.textContent.length >= 7) {
          const original = field008.textContent;
          const updated = original.substring(0, 6) + 'd' + original.substring(7);
          field008.textContent = updated;
        }

        //update 008 11-14
        const field008Date = doc.querySelector('controlfield[tag="008"]');
          if (field008Date && field008Date.textContent.length >= 15) {
            const original008 = field008Date.textContent;
            const updatedYear = this.yearCeased.toString().padStart(4, '0');
           // Replace bytes 11–14 (indexes 10–13 because index is 0-based)
            const updated008 = 
              original008.slice(0, 11) + 
              updatedYear + 
              original008.slice(15);
            field008Date.textContent = updated008;
          }

          //Update 260 and 264 $c
          const dateFields = doc.querySelectorAll('datafield[tag="260"], datafield[tag="264"]');
          dateFields.forEach(field => {
            const subfieldC = field.querySelector('subfield[code="c"]');
            if (subfieldC) {
              const original = subfieldC.textContent.trim();
              const regex = /^(\d{4})\s*-\s*:$/;
              if (regex.test(original)) {
                const updated = original.replace(regex, `$1-${this.yearCeased}:`);
                subfieldC.textContent = updated;
              }
            }
          });

          //Update 264 $3
          const dateFields2 = doc.querySelectorAll('datafield[tag="264"]');
          dateFields2.forEach(field => {
            const subfield3 = field.querySelector('subfield[code="3"]');
            if (subfield3) {
              const original = subfield3.textContent.trim();
              const regex = /^(\d{4})\s*-\s*:$/;
              if (regex.test(original)) {
                const updated = original.replace(regex, `$1-${this.yearCeased}:`);
                subfield3.textContent = updated;
              }
            }
          });

          //Update 362 $a
          if (doc.querySelector('datafield[tag="362"][ind1="1"]')){
          const field362 = doc.querySelectorAll('datafield[tag="362"]');
          field362.forEach(field => {
            const subfieldA = field.querySelector('subfield[code="a"]');
            if (subfieldA && subfieldA.textContent) {
              let originalText = subfieldA.textContent.trim();
              // Remove trailing period if exists
              if (originalText.endsWith('.')) {
                originalText = originalText.slice(0, -1);
              }
              subfieldA.textContent = `${originalText}; ceased with ${this.ceasedDetails}`;
            }
          });
        }

          //Add 362 $
          if (doc.querySelector('datafield[tag="362"][ind1="0"]')){
            const datafield362 = dom("datafield", {
              parent: doc.documentElement,
              attributes: [["tag", "362"], ["ind1", "0"], ["ind2", ""]]
            });
            dom("subfield", {
              parent: datafield362,
              text: `Ceased with ${this.ceasedDetails}`,
              attributes: [["code", "a"]]
            });
          }

          //Add 785
          if (currentTitleFields?.currentField245a) {
            const datafield785 = dom("datafield", {
              parent: doc.documentElement,
              attributes: [["tag", "785"], ["ind1", "0"], ["ind2", this.prevContinuationType]]
            });
            dom("subfield", {
              parent: datafield785,
              text: currentTitleFields.currentField245a,
              attributes: [["code", "t"]]
            });
            if (currentTitleFields?.currentField022a){
              dom("subfield", {
                parent: datafield785,
                text: currentTitleFields.currentField022a,
                attributes: [["code", "x"]]
              });
            }
            if (currentTitleFields?.currentField010a){
              dom("subfield", {
                parent: datafield785,
                text: currentTitleFields.currentField010a,
                attributes: [["code", "w"]]
              });
            }
            if (currentTitleFields?.currentField035a){
              dom("subfield", {
                parent: datafield785,
                text: currentTitleFields.currentField035a,
                attributes: [["code", "w"]]
              });
            }
            dom("subfield", {
              parent: datafield785,
              text: currentTitleFields.currentField0359,
              attributes: [["code", "w"]]
            });
          }
          
          //Add 988
          if (currentTitleFields?.currentField0359) {
            const datafield988 = dom("datafield", {
              parent: doc.documentElement,
              attributes: [["tag", "988"], ["ind1", ""], ["ind2", ""]]
            });
            dom("subfield", {
              parent: datafield988,
              text: currentTitleFields.currentField0359,
              attributes: [["code", "a"]]
            });
            dom("subfield", {
              parent: datafield988,
              text: currentDate,
              attributes: [["code", "b"]]
            });
          }

          //Add 995
          const field995d = doc.querySelector('datafield[tag="995"] subfield[code="d"]');
          if (field995d) {
            field995d.textContent = currentDate;
          } else {
            const datafield995 = dom("datafield", {
              parent: doc.documentElement,
              attributes: [["tag", "995"], ["ind1", "",], ["ind2", ""]]
            });
            dom("subfield", {
              parent: datafield995,
              text: 'REV',
              attributes: [["code", "c"]]
            });
            dom("subfield", {
              parent: datafield995,
              text: currentDate,
              attributes: [["code", "d"]]
            });
          }
              
    bib.anies = new XMLSerializer().serializeToString(doc.documentElement);
    return bib; 
  }
}


// Adds Element to dom and returns it 
const dom = (name: string, options: {parent?: Element | Node, text?: 
  string, className?: string, id?: string, attributes?: string[][]} = {}
  ): Element => {

  let ns = options.parent ? options.parent.namespaceURI : '';
  let element = document.createElementNS(ns, name);

  if (options.parent) options.parent.appendChild(element);
  if (options.text) element.textContent = options.text;
  if (options.className) element.className = options.className;
  if (options.id) element.id = options.id;
  if (options.attributes) options.attributes.forEach(([att, val]) => element.setAttribute(att, val));

  return element;  
}
  
