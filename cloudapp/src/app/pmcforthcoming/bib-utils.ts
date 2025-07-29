import { CloudAppRestService, HttpMethod } from "@exlibris/exl-cloudapp-angular-lib";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { StringLiteral } from "typescript";

export interface Bib {
  link: string,
  mms_id: string;
  title: string;
  author: string;
  record_format: string;
  anies: any;
  }

export class BibUtils {
  private _restService: CloudAppRestService;

  constructor(restService: CloudAppRestService) {
    this._restService = restService;
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

  //Check number of 510 fields before additional PMC fields
  check510(bib: Bib): boolean{
      if (!bib || !bib.anies) {
          console.error("Invalid Bib object:", bib);
          return false;
            }
      const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
      const field510 = doc.querySelectorAll('datafield[tag="510"]');
        console.log("Found 510 fields:", field510);
      //check all 510 fields for subfield 9
      for (const field of Array.from(field510)){
          const subfield9 = field.querySelector('subfield[code="9"]');
          if (subfield9){
            console.log("510 field with subfield 9 found:", field);
          return true;
          }
      }
      console.log("No 510 field with subfield 9 found");
      return false;
  }

  //Add 510 PMC Fields
  addNoteToBib(bib: Bib) {
      const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
      if(this.check510(bib)){
        const datafield = dom("datafield", { 
            parent: doc.documentElement, 
            attributes: [ ["tag", "510"], ["ind1", "0"], ["ind2", " "] ]
        });
            dom("subfield", { 
                parent: datafield, 
                text: `PMC Forthcoming`, 
                attributes: [ ["code", "a"] ]
            });
        }else{
            const datafield = dom("datafield", { 
                parent: doc.documentElement, 
                attributes: [ ["tag", "510"], ["ind1", "0"], ["ind2", " "] ]
            });
                dom("subfield", { 
                    parent: datafield, 
                    text: `0`, 
                    attributes: [ ["code", "9"] ]
                });
                dom("subfield", { 
                    parent: datafield, 
                    text: `PubMed`, 
                    attributes: [ ["code", "a"] ]
                });
                dom("subfield", { 
                    parent: datafield, 
                    text: `Coverage to be announced`, 
                    attributes: [ ["code", "b"] ]
                });
            const second510 = dom("datafield", {
                parent: doc.documentElement,
                attributes: [["tag", "510"], ["ind1", "0"], ["ind2", " "]]
            });
                dom("subfield", {
                    parent: second510,
                    text: `PMC Forthcoming`,
                    attributes: [["code", "a"]]
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
