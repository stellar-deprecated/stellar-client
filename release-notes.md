# Release Notes

## Development

[Commits](https://github.com/stellar/stellar-client/commits/master)

##Week 15 2015 (April 13-19)

##New Features and Changes

 - Pull Request [1173](https://github.com/stellar/stellar-client/pull/1173) Remove domain name from input field for password change

##Week 12 - 2015 (March 16-22)

###New Features and Changes

 - Pull Request [1183](https://github.com/stellar/stellar-client/pull/1183) Add subscribe checkbox to add email forms. Fixes Issue [1182](https://github.com/stellar/stellar-client/issues/1182) 

 - Pull Request [1179](https://github.com/stellar/stellar-client/pull/1179) Add apply() to lost-2fa-device-controller. 

 - Pull Request [1180](https://github.com/stellar/stellar-client/pull/1180) Fix $(...).tooltip is not a function errors in Sentry. 

 - Pull Request [1177](https://github.com/stellar/stellar-client/pull/1177) Fix misspellings, add ingores to raven

##Week 11 - 2015 (March 9-15)

###New Features and Changes

 - Pull Request [1175](https://github.com/stellar/stellar-client/pull/1175) Change minimum balance copy. Fixes Issue [1174](https://github.com/stellar/stellar-client/issues/1174)

##Week 10 - 2015 (March 2-8)

_Many thanks to @gterzian for his contributions to stellar-client_

###New Features and Changes

 - Pull Request [1167](https://github.com/stellar/stellar-client/pull/1167) Test coverage for Gateways Controllers (Thank you @gterzian)

##Week 9 - 2015 

##New Features and Changes

 - Pull Request [1169](https://github.com/stellar/stellar-client/pull/1169) Add a default delay to the tooltip util
 - Pull Request [1172](https://github.com/stellar/stellar-client/pull/1172) Upgrade to v2 recaptcha

##Week 8 - 2015

_Many thanks to @gterzian for his contributions to stellar-client_

###New Features and Changes

 - Pull Request [1157](https://github.com/stellar/stellar-client/pull/1157) Add error handling for unexpected responses
 - Pull Request [1151](https://github.com/stellar/stellar-client/pull/1151) First karma test passing (Thank you @gterzian)
 - Pull Request [1161](https://github.com/stellar/stellar-client/pull/1161) Check destination tag is a valid unsigned 32 bit integer

###Bug Fixes

 - Pull Request [1164](https://github.com/stellar/stellar-client/pull/1164) to fix [1153](https://github.com/stellar/stellar-client/issues/1153) Cannot read property 'to_human_full' of null


##Week 7 - 2015

###New Features and Changes

 - Pull Request [1152](https://github.com/stellar/stellar-client/pull/1152) Check frontend-client server for status.json (check server status)

###Bug Fixes

 - Pull Request [1161](https://github.com/stellar/stellar-client/pull/1161) Check destination tag is a valid unsigned 32-bit integer, fixes Issue [1159](https://github.com/stellar/stellar-client/issues/1159)
 - Pull Request [1154](https://github.com/stellar/stellar-client/pull/1154) Bump angular re-captcha version to fix [1137](https://github.com/stellar/stellar-client/issues/1137) Cannot read property 'destroy' of undefined (error)
 - Pull Request [1147](https://github.com/stellar/stellar-client/pull/1147) Fix back buttons; to fix bug introduced in [1127](https://github.com/stellar/stellar-client/pull/1127)

##Week 6 - 2015

###New Features and Changes

 - Pull Request [1148](https://github.com/stellar/stellar-client/pull/1148) Notify users that their secret should stay secret

##Week 5 - 2015

###New Features and Changes

 - Pull Request [1146](https://github.com/stellar/stellar-client/pull/1146) Add user context to Raven on login
 - Pull Request [1145](https://github.com/stellar/stellar-client/pull/1145) Add unexpected response loggers to reward handlers
 - Pull Request [1143](https://github.com/stellar/stellar-client/pull/1143) Display message to users affected by change password bug

##Week 4 - 2015

###New Features and Changes
 
 - [1138](https://github.com/stellar/stellar-client/pull/1138) Add utility for debugging user accounts

 ###Bug Fixes

 - [1142](https://github.com/stellar/stellar-client/pull/1142) Use blank href to prevent default link navigation, fixes [1141](https://github.com/stellar/stellar-client/issues/1141)
 - [1131](https://github.com/stellar/stellar-client/pull/1131) Change state names to work after recent ui-sfref commit, fixes [1127](https://github.com/stellar/stellar-client/pull/1127)

##Week 3 - 2015

###New Features and Changes
 
 - [1128](https://github.com/stellar/stellar-client/pull/1128) Show issuers on the trade confirmations page
 - [1098](https://github.com/stellar/stellar-client/pull/1098) Add email loading state until user info resolved
 - [1127](https://github.com/stellar/stellar-client/pull/1127) Use ui-sref

##Week 2 - 2015

###New Features and Changes

 - [1124](https://github.com/stellar/stellar-client/pull/1124) Add Help Desk link to footer of client
 - [1120](https://github.com/stellar/stellar-client/pull/1120) Prevent changes to the DT value from mouse wheel (scroll)

###Bug Fixes

 - [1126](https://github.com/stellar/stellar-client/pull/1126) Fix a bug introduced in [#1120](https://github.com/stellar/stellar-client/pull/1120)

##December 2014

###New Features and Changes

 - [1116](https://github.com/stellar/stellar-client/pull/1116) Add message to console to warn against self-xss phishing attacks
 - [1114](https://github.com/stellar/stellar-client/pull/1114) Display invitee username 
 - [1112](https://github.com/stellar/stellar-client/pull/1112) Change relative URL to hash URL on Settings page 
 - [1111](https://github.com/stellar/stellar-client/pull/1111) Add analytics events to client
 - [1110](https://github.com/stellar/stellar-client/pull/1110) Remove CLA Hub integration and moves CLA to gdoc 
 - [1109](https://github.com/stellar/stellar-client/pull/1109) Add user-specific gulp config, allows skipping lint hooks 
 - [1108](https://github.com/stellar/stellar-client/pull/1108) Load server status and displays alert on login and registration  page
 - [1107](https://github.com/stellar/stellar-client/pull/1107) Add delete account and transfer balance in settings menu 
 - [1105](https://github.com/stellar/stellar-client/pull/1105) Show amount errors, unifies errors and updatePaths() 
 - [1096](https://github.com/stellar/stellar-client/pull/1096) Clarify bid/ask with explicit buy/sell caption 

###Bug fixes

 - [1113](https://github.com/stellar/stellar-client/pull/1113) Update recovery data after changing  (fixes bug [421](https://github.com/stellar/ix/issues/421)) 
 - [1104](https://github.com/stellar/stellar-client/pull/1104) Prevent scientific notation when creating amount (fixes bug [859](https://github.com/stellar/stellar-client/issues/859)) 
 - [1103](https://github.com/stellar/stellar-client/pull/1103) Fix bug during recovery in ChangePassword (fixes bug [1102](https://github.com/stellar/stellar-client/issues/1102))






