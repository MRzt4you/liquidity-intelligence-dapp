import {intelligence} from './intelligence';
export class SignalEngine{private items:any[]=[];score(e:any){const x=intelligence(e);return{...x,score:x.score}}push(x:any){this.items.unshift(x);this.items=this.items.slice(0,200)}recent(){return this.items}}
