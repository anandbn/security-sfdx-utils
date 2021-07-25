import { flags, SfdxCommand, TableOptions } from '@salesforce/command';
import { Messages} from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('security-plugins', 'profile-object-summary');

export default class ProfileList extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [];

  public static args = [];

  protected static flagsConfig = {
    filters: flags.array({ char: 'f', description: messages.getMessage('filtersFlagDescription') }),
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();

    let result:any = await conn.query<any>(`select Description,Id,IsSsoEnabled,Name,UserType from Profile`);
    
    let profileList=result.records;
    if(this.flags.filters && this.flags.filters.length>0){
      profileList = profileList.filter(profile => {
        let includeField=false;
        this.flags.filters.forEach(filter => {
          if(!includeField){
            includeField = profile.Name.includes(filter);
          }
        });
        return includeField;
      });
    }

    profileList = profileList.map(profile => {
      let retObj: any = {};
      retObj.Name = profile.Name;
      retObj.ssoEnabled = profile.allowCreate == 'true' ? 'X' : '';
      retObj.Id = profile.Id;
      retObj.Description = profile.Description;
      retObj.UserType = profile.UserType;
      return retObj;
    });
    let tableColumns:TableOptions = {
      columns:[
      {key:'Id',label: 'Profile Id'},
      {key:'Name',label : 'Profile Name'},
      {key:'IsSsoEnabled',label : 'Sso Enabled?'},
      {key:'UserType',label : 'User Type'},
      {key:'Description',label : 'Description'}
    ]};

    this.ux.table(profileList,tableColumns);

    // Return an object to be displayed with --json
    return profileList;
  }

}
