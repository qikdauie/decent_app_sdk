User Profile 

Summary

A simple protocol for exchanging user profile information between parties.



Summary

A simple protocol for exchanging user profile information between parties.



Data exposed and exchanged within this protocol can be seen as a complement to the basic and untrusted connection information exchanged in Out-of-Band Invitation messages.



Motivation

Modern communication applications normally need some user-friendly information about the other party. For that purpose it's needed to provide a common mechanism to sharing and retrieving user profile information, which might change over time, in more secure and efficient way than the usual Invitation messages.



Roles

There are two roles in this protocol:



sender - The agent that is sending their user profile

receiver - The agent that is receiving the user profile from another one

Basic Walkthrough

Exchanges within this protocol involve a single message when an agent wants to share their profile (or any update to it) without asking for other party profile; two messages might be exchanged in case of Request Profile or Profile with send\_back\_yours enabled.







States

As of current specification, no particular state transitions are defined.



Message Reference

This section explains the structure of the different messages defined for this protocol.



Profile

This message is used to send user profile to another party.



Description of the fields:



profile: Object containing all supported fields that must be set or updated. Any absent field means that there is no change on that field so the recipient must keep the previous value for this connection. When a field previously present needs to be removed, it must be explicitly set to null or an empty string (e.g. `{ "displayPicture": null }``).

displayName: String containing user display name in the language specified by localization

displayPicture: Reference to an appended attachment which might contain a link to download the picture or an embedded base64 picture. It can also contain a message to retrieve the file through Media Sharing protocol

description: free text containing user's bio

send\_back\_yours: When this parameter is defined and set to true, the recipient is expected to send another Profile message containing their profile. Such message should include this message ID as pthid. Agents must not include this parameter when the message is created as a result of another one.

Note: When send\_back\_yours is set, the other party is asked to send their profile. However, it might either choose not to do it or send it in another instance of this protocol. Therefore, the protocol can be considered properly finished as soon as Profile message is successfully sent.



DIDComm v1 example:



{

&nbsp;   "@id": "8ba049e6-cc46-48fb-bfe0-463084d66324",

&nbsp;   "@type": "<baseuri>/profile",

&nbsp;   "profile": {

&nbsp;       "displayName": "John Doe",

&nbsp;       "displayPicture": "#item1",

&nbsp;       "description": "This is my bio"

&nbsp;   }, 

&nbsp;   "send\_back\_yours": true,

&nbsp;   "~attach": \[{

&nbsp;       "@id": "item1",

&nbsp;       "byte\_count": "23894",

&nbsp;       "mime-type": "image/png",

&nbsp;       "filename": "image1.png",

&nbsp;       "data": {

&nbsp;           "links": \[ "https://fileserver.com/ref1-uuid" ]

&nbsp;       },

&nbsp;   }]    

}

DIDComm v2 example:



{

&nbsp;   "id": "8ba049e6-cc46-48fb-bfe0-463084d66324",

&nbsp;   "type": "<baseuri>/profile",

&nbsp;   "body": {

&nbsp;       "profile": {

&nbsp;           "displayName": "John Doe",

&nbsp;           "displayPicture": "#item1",

&nbsp;           "description": "This is my bio"

&nbsp;       }, 

&nbsp;       "send\_back\_yours": true,

&nbsp;   },

&nbsp;   "attachments": \[{

&nbsp;       "@id": "item1",

&nbsp;       "byte\_count": "23894",

&nbsp;       "media\_type": "image/png",

&nbsp;       "filename": "image1.png",

&nbsp;       "data": {

&nbsp;           "base64": "iVBORw0KGgoAAAANSUhEUgAAAKsAAADV..."

&nbsp;       },

&nbsp;   }]    

}

Request Profile

This message is used to request a profile. Recipient is expected to send their profile at its current state. This will trigger a new instance of this protocol, using Request Profile message's id as pthid.



DIDComm v1 example:



{

&nbsp;   "@id": "8ba049e6-cc46-48fb-bfe0-463084d66324",

&nbsp;   "@type": "<baseuri>/request-profile",

&nbsp;   "query": \[ "displayName", "displayPicture", "description" ]

}

DIDComm v2 example:



{

&nbsp;   "id": "8ba049e6-cc46-48fb-bfe0-463084d66324",

&nbsp;   "type": "<baseuri>/request-profile",

&nbsp;   "body": {

&nbsp;       "query": \[ "displayName", "displayPicture", "description" ]

&nbsp;   }

}

query parameter is optional and defines which fields the requester is interested in. If no specified, responder must send their full profile.



Implementations

Current implementations of this protocol are listed below:



Name / Link	Implementation Notes

Aries JavaScript User Profile	Initial implementation as an extension module for Aries Framework JavaScript. Used in 2060.io Mobile Agent and Service Agent.

Endnotes

Future Considerations

