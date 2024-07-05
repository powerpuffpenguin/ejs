#ifndef _EMBEDDED_JS__DUK_MODULES_NET_HTTP_H_
#define _EMBEDDED_JS__DUK_MODULES_NET_HTTP_H_

#define EJS_HTTP_StatusContinue 100           // RFC 9110, 15.2.1
#define EJS_HTTP_StatusSwitchingProtocols 101 // RFC 9110, 15.2.2
#define EJS_HTTP_StatusProcessing 102         // RFC 2518, 10.1
#define EJS_HTTP_StatusEarlyHints 103         // RFC 8297

#define EJS_HTTP_StatusOK 200                   // RFC 9110, 15.3.1
#define EJS_HTTP_StatusCreated 201              // RFC 9110, 15.3.2
#define EJS_HTTP_StatusAccepted 202             // RFC 9110, 15.3.3
#define EJS_HTTP_StatusNonAuthoritativeInfo 203 // RFC 9110, 15.3.4
#define EJS_HTTP_StatusNoContent 204            // RFC 9110, 15.3.5
#define EJS_HTTP_StatusResetContent 205         // RFC 9110, 15.3.6
#define EJS_HTTP_StatusPartialContent 206       // RFC 9110, 15.3.7
#define EJS_HTTP_StatusMultiStatus 207          // RFC 4918, 11.1
#define EJS_HTTP_StatusAlreadyReported 208      // RFC 5842, 7.1
#define EJS_HTTP_StatusIMUsed 226               // RFC 3229, 10.4.1

#define EJS_HTTP_StatusMultipleChoices 300   // RFC 9110, 15.4.1
#define EJS_HTTP_StatusMovedPermanently 301  // RFC 9110, 15.4.2
#define EJS_HTTP_StatusFound 302             // RFC 9110, 15.4.3
#define EJS_HTTP_StatusSeeOther 303          // RFC 9110, 15.4.4
#define EJS_HTTP_StatusNotModified 304       // RFC 9110, 15.4.5
#define EJS_HTTP_StatusUseProxy 305          // RFC 9110, 15.4.6
                                             // _                       = 306 // RFC 9110, 15.4.7 (Unused)
#define EJS_HTTP_StatusTemporaryRedirect 307 // RFC 9110, 15.4.8
#define EJS_HTTP_StatusPermanentRedirect 308 // RFC 9110, 15.4.9

#define EJS_HTTP_StatusBadRequest 400                   // RFC 9110, 15.5.1
#define EJS_HTTP_StatusUnauthorized 401                 // RFC 9110, 15.5.2
#define EJS_HTTP_StatusPaymentRequired 402              // RFC 9110, 15.5.3
#define EJS_HTTP_StatusForbidden 403                    // RFC 9110, 15.5.4
#define EJS_HTTP_StatusNotFound 404                     // RFC 9110, 15.5.5
#define EJS_HTTP_StatusMethodNotAllowed 405             // RFC 9110, 15.5.6
#define EJS_HTTP_StatusNotAcceptable 406                // RFC 9110, 15.5.7
#define EJS_HTTP_StatusProxyAuthRequired 407            // RFC 9110, 15.5.8
#define EJS_HTTP_StatusRequestTimeout 408               // RFC 9110, 15.5.9
#define EJS_HTTP_StatusConflict 409                     // RFC 9110, 15.5.10
#define EJS_HTTP_StatusGone 410                         // RFC 9110, 15.5.11
#define EJS_HTTP_StatusLengthRequired 411               // RFC 9110, 15.5.12
#define EJS_HTTP_StatusPreconditionFailed 412           // RFC 9110, 15.5.13
#define EJS_HTTP_StatusRequestEntityTooLarge 413        // RFC 9110, 15.5.14
#define EJS_HTTP_StatusRequestURITooLong 414            // RFC 9110, 15.5.15
#define EJS_HTTP_StatusUnsupportedMediaType 415         // RFC 9110, 15.5.16
#define EJS_HTTP_StatusRequestedRangeNotSatisfiable 416 // RFC 9110, 15.5.17
#define EJS_HTTP_StatusExpectationFailed 417            // RFC 9110, 15.5.18
#define EJS_HTTP_StatusTeapot 418                       // RFC 9110, 15.5.19 (Unused)
#define EJS_HTTP_StatusMisdirectedRequest 421           // RFC 9110, 15.5.20
#define EJS_HTTP_StatusUnprocessableEntity 422          // RFC 9110, 15.5.21
#define EJS_HTTP_StatusLocked 423                       // RFC 4918, 11.3
#define EJS_HTTP_StatusFailedDependency 424             // RFC 4918, 11.4
#define EJS_HTTP_StatusTooEarly 425                     // RFC 8470, 5.2.
#define EJS_HTTP_StatusUpgradeRequired 426              // RFC 9110, 15.5.22
#define EJS_HTTP_StatusPreconditionRequired 428         // RFC 6585, 3
#define EJS_HTTP_StatusTooManyRequests 429              // RFC 6585, 4
#define EJS_HTTP_StatusRequestHeaderFieldsTooLarge 431  // RFC 6585, 5
#define EJS_HTTP_StatusUnavailableForLegalReasons 451   // RFC 7725, 3

#define EJS_HTTP_StatusInternalServerError 500           // RFC 9110, 15.6.1
#define EJS_HTTP_StatusNotImplemented 501                // RFC 9110, 15.6.2
#define EJS_HTTP_StatusBadGateway 502                    // RFC 9110, 15.6.3
#define EJS_HTTP_StatusServiceUnavailable 503            // RFC 9110, 15.6.4
#define EJS_HTTP_StatusGatewayTimeout 504                // RFC 9110, 15.6.5
#define EJS_HTTP_StatusHTTPVersionNotSupported 505       // RFC 9110, 15.6.6
#define EJS_HTTP_StatusVariantAlsoNegotiates 506         // RFC 2295, 8.1
#define EJS_HTTP_StatusInsufficientStorage 507           // RFC 4918, 11.5
#define EJS_HTTP_StatusLoopDetected 508                  // RFC 5842, 7.2
#define EJS_HTTP_StatusNotExtended 510                   // RFC 2774, 7
#define EJS_HTTP_StatusNetworkAuthenticationRequired 511 // RFC 6585, 6

#endif