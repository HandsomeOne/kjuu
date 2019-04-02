export class JASON {
  constructor(public value: any) {}
  toString() {
    return JSON.stringify(this.value)
  }
}

export default (value: any) => new JASON(value)
