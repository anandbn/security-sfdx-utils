import { flags, SfdxCommand } from '@salesforce/command';
import { Messages,SfdxError } from '@salesforce/core';
var request = require("request");
const parseXmlString = require('xml2js').parseString;
// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('security-plugins', 'profile-create');
interface IdAndName {
  Id: string
  DeveloperName: string
  VersionNumber: string
  Status: string
}
export default class ProfileCreate extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    ``
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    name: flags.string({ char: 'n', description: messages.getMessage('nameFlag'), required: true }),
    description: flags.array({ char: 'd', description: messages.getMessage('descriptionFlag'), required: true }),
    licensetype: flags.array({ char: 'l', description: messages.getMessage('licenseFlag'), required: true }),

  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<any> {
    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();

    let result = await conn.query<IdAndName>(`SELECT Id,Name FROM UserLicense where MasterLabel='${this.flags.licensetype}'`);
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('licenseTypeNotFound', [this.flags.name]));
    }

    var profileCreateSoap = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com" xmlns:urn1="urn:sobject.enterprise.soap.sforce.com" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soapenv:Header>
    <urn:SessionHeader>
      <urn:sessionId>${conn.accessToken}</urn:sessionId>
    </urn:SessionHeader>
  </soapenv:Header>
  <soapenv:Body>
    <urn:create>
      <urn:sObjects xsi:type="urn1:Profile">
            <urn1:Name>${this.flags.name}</urn1:Name>
            <urn1:Description>${this.flags.description}</urn1:Description>
            <urn1:UserLicenseId>${result.records[0].Id}</urn1:UserLicenseId>
      </urn:sObjects>
    </urn:create>
  </soapenv:Body>
</soapenv:Envelope>
    `
    let that = this;

    request.post({
      rejectUnauthorized: false,
      url: `${conn.instanceUrl}/services/Soap/c/53.0/${this.org.getOrgId}`,
      method: "POST",
      headers: {
        'Content-Type': 'text/xml',
        'SoapAction': '""',
        'Content-Length': Buffer.byteLength(profileCreateSoap)
      },
      body: profileCreateSoap
    }, function (error, response, body) {
      //that.ux.log(`HTTP STATUS:\n${response.statusCode}`);
      //that.ux.log(`SOAP XML Response:\n${response.body}`);
      parseXmlString(response.body, { explicitArray: false },
        function (err, result) {
          let resp = result["soapenv:Envelope"]["soapenv:Body"];
          if(resp.createResponse.result.success =="true"){
            that.ux.log(`Profile created. Id: ${resp.createResponse.result.id}`);
          }else{
            that.ux.error(`Error creating profile. ${resp.createResponse.result.errors.message}`);
          }
        });
    });

    // Return an object to be displayed with --json
    return null;
  }



}
