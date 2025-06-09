import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppService } from '../app.service';
import { Subscription } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { CloudAppEventsService, PageInfo, EntityType, CloudAppRestService, AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { Bib, BibUtils } from './bib-utils';

@Component({
  selector: 'app-pmcforthcoming',
  templateUrl: './pmcforthcoming.component.html',
  styleUrls: ['./pmcforthcoming.component.scss']
})
export class PmcforthcomingComponent implements OnInit, OnDestroy {
  private pageLoad$: Subscription;
  private bibUtils: BibUtils;
  bib: Bib |null =null;
  running = false;
  checkResults: string[] = [];
  summaryCheck: string[] = [];
  showAddPmcButton = false;
  manualUpdateText = "Update record manually.";
  checksRun = false;
  
  constructor(
    private appService: AppService,
    private eventsService: CloudAppEventsService,
    private restService: CloudAppRestService,
    private alert: AlertService
  ) { }

  ngOnInit() {
    this.bibUtils = new BibUtils(this.restService);
    this.pageLoad$ = this.eventsService.onPageLoad((pageInfo: PageInfo) => {
        //console.log('PageInfo:', pageInfo);
    const entities = (pageInfo.entities||[]).filter(e=>[EntityType.BIB_MMS].includes(e.type));
        //console.log('Filtered Entities:', entities);
        if (entities.length  > 0 ) {
            this.bibUtils.getBib(entities[0].id).subscribe(bib=>{
            this.bib = (bib.record_format=='marc21') ? bib : null;
            this.checkResults =[];
            this.summaryCheck =[];
            this.updateButtonVisibility();
            this.checksRun = false;
            });
      } else {
            this.bib = null;
            }
     });
  }
 
  ngOnDestroy(): void {
    this.pageLoad$.unsubscribe();
  }  

  //check for the existence of an 022 field with subfield l
   check022(bib: Bib): string{
      const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
      const field022 = doc.querySelector('datafield[tag="022"]');
      if (!field022){
          return "There is no 022 field. Proceed.";
      }
      const subfieldL = field022.querySelector('subfield[code="l"]');
        if (subfieldL){
            return "022 field exists with subfield l. Proceed.";
      }   
      return "022 field exists without subfield l. Add this subfield manually.";
   }
  
  //check for the existence of an 210 field 
   check210(bib: Bib): boolean{
      const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
      const field210 = doc.querySelectorAll('datafield[tag="210"]');
      //check all 210 fields for subfield 2
      for (const field of Array.from(field210)){
        const subfield2 = field.querySelector('subfield[code="2"]');
        if (subfield2){
        return true;
        }
      }
      return false;
  }
  
  //check for the existence of an 510 field with subfield 9
   check510(bib: Bib): boolean{
      const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
      const field510 = doc.querySelectorAll('datafield[tag="510"]');
      //check all 510 fields for subfield 9
      for (const field of Array.from(field510)){
        const subfield9 = field.querySelector('subfield[code="9"]');
        if (subfield9){
        return true;
        }
      }
      return false;
  }

  //check for the existence of an 510 field already continaing PMC Forthcoming
   check510Pmc(bib: Bib): boolean{
      const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
      const field510Pmc = doc.querySelectorAll('datafield[tag="510"]');
      //check all 510 fields for subfield a containing "PMC Forthcoming"
      for (const field of Array.from(field510Pmc)){
        const subfieldA = field.querySelector('subfield[code="a"]');
        if (subfieldA && subfieldA.textContent?.includes("PMC Forthcoming")){
        return true;
        }
      }
      return false;
  }

  //check for the existence of an 999 field 
    check999(bib: Bib): boolean{
      const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
      const field999 = doc.querySelectorAll('datafield[tag="999"]');
      //check all 999 fields for subfield a containing "noc"
      for (const field of Array.from(field999)){
        const subfieldA = field.querySelector('subfield[code="a"]');
        if (subfieldA && subfieldA.textContent?.includes("NOC")){
        return true;
        }
      }
      return false;
  }

//run all checks and push results
  runChecks(): void{
      this.checkResults =[];
      this.summaryCheck =[];
      this.checksRun = true;
      
      //022
      const status022 = this.check022(this.bib);
      console.log(status022);
      this.checkResults.push(status022);

      //210
      if (this.bib){
          if(this.check210(this.bib)){
              this.checkResults.push("210 field contains subfield 2. Proceed.");
              console.log(this.check210(this.bib));
          }else{
              this.checkResults.push("210 field with subfield 2 does not exist. Update manually.");
          }
      }

      //510
      if (this.bib){
          if(this.check510(this.bib)){
              this.checkResults.push("510 field contains subfield 9. Button will add one 510 field.");
              console.log(this.check510(this.bib));
          }else{
              this.checkResults.push("510 field with subfield 9 does not exist. Button will add two 510 fields.");
          }
      }

      //510 PMC
      if (this.bib){
        if(this.check510Pmc(this.bib)){
        this.checkResults.push("510 field already contains 'PMC Forthcoming'.");
        console.log(this.check510(this.bib));
    }else{
        this.checkResults.push("510 field does not contain 'PMC Forthcoming'.");
    }
      }
     
       //999 "NOC"
      if (this.bib){
          if(this.check999(this.bib)){
              this.checkResults.push("999 subfield a contains 'NOC'. Update manually.");
              console.log(this.check999(this.bib));
          }else{
              this.checkResults.push("999 field with subfield a containing 'NOC' does not exist. Proceed.");
          }
      }

         //Finalize update or not
         const has022WithL = status022 === "022 field exists with subfield l. Proceed." || status022 === "There is no 022 field. Proceed.";
           /* console.log("has022WithL:", has022WithL);
            console.log("check510Pmc:", this.check510Pmc(this.bib));
            console.log("check999:", this.check999(this.bib));
            console.log("check510:", this.check510(this.bib));
            console.log("check210:", this.check210(this.bib));*/
      if (
          !has022WithL &&
          this.check510Pmc(this.bib) &&
          this.check999(this.bib) &&
          !this.check210(this.bib) 
          ){
              this.summaryCheck.push("Record cannot be updated.")
          }
      if (
          has022WithL &&
          !this.check510Pmc(this.bib) &&
          !this.check999(this.bib) &&
          this.check210(this.bib)  
          ){
              this.summaryCheck.push("Use the 'Add PMC Fields' button to update this record.")
          }
  }

// Function to determine button visibility
  updateButtonVisibility(): void {
    if (!this.bib) return
        const has022WithL = this.check022(this.bib) === "022 field exists with subfield l. Proceed." || 
                            this.check022(this.bib) === "There is no 022 field. Proceed.";
    const has210WithSubfield2 = this.check210(this.bib);
    const lacks999WithNoc = !this.check999(this.bib);
    const lacks510WithPMC = !this.check510Pmc(this.bib);
    this.showAddPmcButton = has022WithL && has210WithSubfield2 && lacks999WithNoc && lacks510WithPMC;
    if (!this.showAddPmcButton) {
      this.manualUpdateText = "Update record manually or verify all fields are currently correct " + this.checkResults.join(' ');
    }
  }
  
  addPmcFields(){
      if (!confirm(`Add a note to ${this.bib.mms_id}?`)) return;
        this.running = true;
        this.bib = this.bibUtils.addNoteToBib(this.bib);
        this.bibUtils.updateBib(this.bib).pipe(
        switchMap(res => this.eventsService.refreshPage()),
        tap(() => this.alert.success("Note added to Bib")),
        finalize(() => this.running=false)
        )
      .subscribe({
         error: e => this.alert.error(e.message)
       });
   }
}