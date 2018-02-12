import { Standard } from "activecontracts";

/**
 * Default Onboarding (New Account) contract
 *
 * @export
 * @class Onboard
 * @extends {Standard}
 */
export default class Onboard extends Standard {
  /**
   * Quick Check, Allow all data but make sure it is signatureless
   *
   * @param {boolean} signatureless
   * @returns {Promise<boolean>}
   * @memberof Onboard
   */
  public verify(signatureless: boolean): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (signatureless) {
        resolve(true);
      } else {
        reject("Should be a sigsless flagged transaction");
      }
    });
  }

  /**
   * Mostly Testing, So Don't need to checl
   *
   * @returns {Promise<boolean>}
   * @memberof Onboard
   */
  public vote(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // Auto Approve (Demo Onboarding Contract)
      resolve(true);
    });
  }

  /**
   * Prepares the new streams state to be comitted to the ledger
   *
   * @returns {Promise<any>}
   * @memberof Onboard
   */
  public commit(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      
      // Get Inputs
      let inputs = Object.keys(this.transactions.$i);
      if(inputs.length) {
        let i = inputs.length;
        while(i--) {
          // Create New Activity
          let activity = this.newActivityStream(this.transactions.$i[inputs[i]]);
          activity.setAuthority(this.transactions.$i[inputs[i]].publicKey);

          let state = activity.getState();
          state.name = activity.getName();
          activity.setState(state);
        }
      }
      resolve(true);
    });
  }
}
