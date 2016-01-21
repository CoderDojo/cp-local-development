# Configuration for Salesforce locally

- Please note that the CoderDojo Foundation will need to add you to Salesforce first before you can develop with it. Please contact the Tech Lead @tangentfairy if you want to do this!

- There is a file in the [cp-dojos-service](https://github.com/CoderDojo/cp-dojos-service) repository called [development.env](https://github.com/CoderDojo/cp-dojos-service/blob/master/config/development.env#L9) - you will need to change `SALESFORCE_ENABLED` to `true` in this file
- In the [cp-salesforce-service](https://github.com/CoderDojo/cp-salesforce-service/) repository there is another [development.env](https://github.com/CoderDojo/cp-salesforce-service/blob/master/config/development.env) file where you will need to put your credentials. The username is usually your regular Salesforce account followed by test e.g. someemail@test.com.test. Your password is your regular password with your [security token](https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_concepts_security.htm) appended to it.
