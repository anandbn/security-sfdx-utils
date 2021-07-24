security-plugins
================

A collection of sfdx plugins around sharing, profile and permissionset configurations

### Installation

```
sfdx plugins:install https://github.com/anandbn/security-sfdx-utils

```


## `security:profile-summary`

This plugin summarizes the profile permissions in a simple table. 

### Parameters:

- `-n` / `--name` : Name of the profile
- `-o` / `--objects` : List of objects to filter the results
- `-f` / `--filter` : A string filter to filter all results
- `-t` / `--type` : Type of Summary. `CRUD` | `FLS` | `TAB` | `APP`. Default is `CRUD`

### Examples

__Object CRUD__:

```
$ sfdx security:profile-summary -n 'MyProfile' -u my-org-alias 


Object                      Create  Read  Update  Delete  View All  Modify All
──────────────────────────  ──────  ────  ──────  ──────  ────────  ──────────
Account                             X     X               X
Case                                X     X               X
Contact                             X     X               X
ContractLineItem                    X
Entitlement                         X
EntitlementContact                  X
LiveAgentSession                    X
LiveChatTranscript                  X     X
LiveChatVisitor                     X
Macro                               X
QuickText                           X
ServiceContract                     X
ServiceResource                     X
SessionHijackingEventStore          X
Survey                              X                     X
SurveyInvitation                    X                     X
SurveyResponse              X       X                     X
SurveySubject               X       X                     X
```

__Object CRUD for Account & Case__:

```
$ sfdx security:profile-summary -n 'MyProfile' -u my-org-alias -o 'Account,Case'


Object                      Create  Read  Update  Delete  View All  Modify All
──────────────────────────  ──────  ────  ──────  ──────  ────────  ──────────
Account                             X     X               X
Case                                X     X               X
```

__Object CRUD for any Survey object__:

```
$ sfdx security:profile-summary -n 'MyProfile' -u my-org-alias -f 'Survey'

Object            Create  Read  Update  Delete  View All  Modify All
────────────────  ──────  ────  ──────  ──────  ────────  ──────────
Survey                    X                     X
SurveyInvitation          X                     X
SurveyResponse    X       X                     X
SurveySubject     X       X                     X
```


__FLS for any all custom fields in Case__:

```
$ sfdx security:profile-summary -n 'MyProfile' -u my-org-alias -o 'Case' -f '__c' -t FLS

Object.Field           Read  Update
─────────────────────  ────  ──────
Case.Application__c    X     X
Case.Policy_Number__c  X     X
Case.State__c          X     X
```


__All Application visibility settings__:

```
$ sfdx security:profile-summary -n 'MyProfile' -u my-org-alias -t APP

Application                         Is Default?  Is Visible?
──────────────────────────────────  ───────────  ───────────
Lead_Generation
Relationship_Management
Sales_Leadership
Sales_Operations
standard__AllTabSet
standard__AppLauncher
standard__Chatter
standard__Community
standard__DataManager
standard__Insights
standard__InsuranceConsole
standard__LightningBolt
standard__LightningInstrumentation
standard__LightningSales
standard__LightningSalesConsole
standard__LightningService          X
standard__Marketing
standard__OnlineSales
standard__Platform
standard__Sales
standard__SalesforceCMS
standard__Service
standard__ServiceConsole
```

__All Tab visibility settings__:

```
$ sfdx security:profile-summary -n 'MyProfile' -u my-org-alias -t TAB

Tab                                      Is Visible?  Default ON?  Default OFF
───────────────────────────────────────  ───────────  ───────────  ───────────
ApplicationErrorLog__c
standard-Account                         X            X
standard-AccountBrand
standard-ActionPlan
standard-ResidentialLoanApplication      X                         X
standard-Scorecard
standard-WorkBadgeDefinition
standard-WorkOrder
standard-WorkerCompCoverageClass
standard-home                            X            X
standard-report                          X            X

```

__All Tab visibility settings that are Default ON__:

```
$ sfdx security:profile-summary -n 'MyProfile' -u my-org-alias -t TAB -f 'DefaultOn'

Tab                          Is Visible?  Default ON?  Default OFF
───────────────────────────  ───────────  ───────────  ───────────
standard-Account             X            X
standard-Case                X            X
standard-Contact             X            X
standard-LiveChatTranscript  X            X
standard-home                X            X
standard-report              X            X
```