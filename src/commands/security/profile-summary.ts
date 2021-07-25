import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson,QueryResult } from '@salesforce/ts-types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('security-plugins', 'profile-object-summary');

export default class ProfileSummary extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    ``
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: 'n', description: messages.getMessage('nameFlagDescription'), required:true}),
    objects: flags.array({ char: 'o', description: messages.getMessage('objectsFlagDescription') }),
    filters: flags.array({ char: 'f', description: messages.getMessage('filtersFlagDescription') }),
    type: flags.enum({
      char: 't', description: messages.getMessage('typeFlagDescription'), options: [
        "CRUD",
        "FLS",
        "SYSTEM",
        "TAB",
        "APP"
      ], default: 'CRUD'
    })
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

    let profileObj:QueryResult<any> = await conn.query<QueryResult>(`select Id from Profile where Name='${this.flags.name}'`);
    if(profileObj.totalSize == 0){
      throw new SfdxError(messages.getMessage('errorNoProfileFound', [this.flags.name]));
    }
    let profileMetadata: any = await conn.metadata.readSync('Profile', [`${this.flags.name}`]);

    let retObj;
    switch (this.flags.type) {
      case 'CRUD':
        retObj = this.summarizeObjectCRUD(profileMetadata);
        break;
      case 'FLS':
        retObj = this.summarizeObjectFLS(profileMetadata);
        break;
      case 'SYSTEM':
        retObj = this.summarizeSystemPermissions(profileMetadata);
        break;
      case 'TAB':
        retObj = this.summarizeTabVisiblities(profileMetadata);
        break;
      case 'APP':
        retObj = this.summarizeAppVisiblities(profileMetadata);
        break;
      default:
        retObj = this.summarizeObjectCRUD(profileMetadata);
        break;
    }

    // Return an object to be displayed with --json
    return retObj;
  }


  private summarizeObjectCRUD(profileMetadata) {
    let objectPerms: any[] = profileMetadata.objectPermissions;
    if(this.flags.objects && this.flags.objects.length>0){
      objectPerms = objectPerms.filter(objPerm => this.flags.objects.includes(objPerm.object));
    }
    if(this.flags.filters && this.flags.filters.length>0){
      objectPerms = objectPerms.filter(objPerm => {
        let includeField=false;
        this.flags.filters.forEach(filter => {
          if(!includeField){
            includeField = objPerm.object.includes(filter);
          }
        });
        return includeField;
      });
    }
    objectPerms = objectPerms.map(objPerm => {
        let retObj: any = {};
        retObj.object = objPerm.object;
        retObj.create = objPerm.allowCreate == 'true' ? 'X' : '';
        retObj.read = objPerm.allowRead == 'true' ? 'X' : '';
        retObj.edit = objPerm.allowEdit == 'true' ? 'X' : '';
        retObj.delete = objPerm.allowDelete == 'true' ? 'X' : '';
        retObj.viewAll = objPerm.viewAllRecords == 'true' ? 'X' : '';
        retObj.modifyAll = objPerm.modifyAllRecords == 'true' ? 'X' : '';
        return retObj;
    });
    let tableColumnData = {
      columns: [
        { key: 'object', label: 'Object' },
        { key: 'create', label: 'Create' },
        { key: 'read', label: 'Read' },
        { key: 'edit', label: 'Update' },
        { key: 'delete', label: 'Delete' },
        { key: 'viewAll', label: 'View All' },
        { key: 'modifyAll', label: 'Modify All' },
      ]
    }

    this.ux.table(objectPerms, tableColumnData);
    return {"objectPermissions":profileMetadata.objectPermissions};
  }

  private summarizeObjectFLS(profileMetadata) { 
    let fieldPerms: any[] = profileMetadata.fieldPermissions;
    if(this.flags.objects && this.flags.objects.length>0){
      fieldPerms = fieldPerms.filter(fldPerm => {
        let includeField=false;
        this.flags.objects.forEach(obj => {
          if(!includeField){
            includeField = fldPerm.field.includes(obj);
          }
        });
        return includeField;
      });
    }

    if(this.flags.filters && this.flags.filters.length>0){
      fieldPerms = fieldPerms.filter(fldPerm => {
        let includeField=false;
        this.flags.filters.forEach(filter => {
          if(!includeField){
            includeField = fldPerm.field.includes(filter);
          }
        });
        return includeField;
      });
    }
    fieldPerms = fieldPerms.map(fldPerm => {
        let retObj: any = {};
        retObj.field = fldPerm.field;
        retObj.edit = fldPerm.editable == 'true' ? 'X' : '';
        retObj.read = fldPerm.readable == 'true' ? 'X' : '';
        return retObj;
    });
    let tableColumnData = {
      columns: [
        { key: 'field', label: 'Object.Field' },
        { key: 'read', label: 'Read' },
        { key: 'edit', label: 'Update' }
      ]
    }

    this.ux.table(fieldPerms, tableColumnData);
    return {"fieldPermissions":profileMetadata.fieldPermissions};
  }

  private summarizeSystemPermissions(profileMetadata){
  }

  private summarizeTabVisiblities(profileMetadata){
    let tabPerms: any[] = profileMetadata.tabVisibilities;

    if(this.flags.filters && this.flags.filters.length>0){
      tabPerms = tabPerms.filter(tabPerm => {
        let includeField=false;
        this.flags.filters.forEach(filter => {
          if(!includeField){
            includeField = tabPerm.tab.includes(filter) || tabPerm.visibility.includes(filter);
          }
        });
        return includeField;
      });
    }
    tabPerms = tabPerms.map(tabPerm => {
      let retObj: any = {};
      retObj.tab = tabPerm.tab;
      retObj.visible = (tabPerm.visibility == 'Hidden' ) ? '' : 'X';
      retObj.defaultOn = (tabPerm.visibility == 'DefaultOn') ? 'X' : '';
      retObj.defaultOff = (tabPerm.visibility == 'DefaultOff') ? 'X' : '';
      return retObj;
    });
    let tableColumnData = {
      columns: [
        { key: 'tab', label: 'Tab' },
        { key: 'visible', label: 'Is Visible?' },
        { key: 'defaultOn', label: 'Default ON?' },
        { key: 'defaultOff', label: 'Default OFF' }
      ]
    }

    this.ux.table(tabPerms, tableColumnData);
    return {"tabVisibilities":profileMetadata.tabVisibilities};
  }
  private async summarizeAppVisiblities(profileMetadata){
    
    let appPerms: any[] = profileMetadata.applicationVisibilities;
    appPerms = appPerms.map(appPerm => {
      let retObj: any = {};
      retObj.application = appPerm.application;
      retObj.default = appPerm.default == 'true' ? 'X' : '';
      retObj.read = appPerm.visible == 'true' ? 'X' : '';
      return retObj;
    });
    let tableColumnData = {
      columns: [
        { key: 'application', label: 'Application' },
        { key: 'default', label: 'Is Default?' },
        { key: 'visible', label: 'Is Visible?' }
      ]
    }

    this.ux.table(appPerms, tableColumnData);
    return {"applicationVisibilities":profileMetadata.applicationVisibilities};
  }
}
