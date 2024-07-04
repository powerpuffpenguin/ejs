#ifndef _EMBEDDED_JS__DUK_HTTP_H_
#define _EMBEDDED_JS__DUK_HTTP_H_
#include "../duk/duktape.h"
duk_ret_t _ejs_native_http_init(duk_context *ctx);

#define StatusContinue 100           // RFC 9110, 15.2.1
#define StatusSwitchingProtocols 101 // RFC 9110, 15.2.2
#define StatusProcessing 102         // RFC 2518, 10.1
#define StatusEarlyHints 103         // RFC 8297

#define StatusOK 200                   // RFC 9110, 15.3.1
#define StatusCreated 201              // RFC 9110, 15.3.2
#define StatusAccepted 202             // RFC 9110, 15.3.3
#define StatusNonAuthoritativeInfo 203 // RFC 9110, 15.3.4
#define StatusNoContent 204            // RFC 9110, 15.3.5
#define StatusResetContent 205         // RFC 9110, 15.3.6
#define StatusPartialContent 206       // RFC 9110, 15.3.7
#define StatusMultiStatus 207          // RFC 4918, 11.1
#define StatusAlreadyReported 208      // RFC 5842, 7.1
#define StatusIMUsed 226               // RFC 3229, 10.4.1

#define StatusMultipleChoices 300   // RFC 9110, 15.4.1
#define StatusMovedPermanently 301  // RFC 9110, 15.4.2
#define StatusFound 302             // RFC 9110, 15.4.3
#define StatusSeeOther 303          // RFC 9110, 15.4.4
#define StatusNotModified 304       // RFC 9110, 15.4.5
#define StatusUseProxy 305          // RFC 9110, 15.4.6
                                    // _                       = 306 // RFC 9110, 15.4.7 (Unused)
#define StatusTemporaryRedirect 307 // RFC 9110, 15.4.8
#define StatusPermanentRedirect 308 // RFC 9110, 15.4.9

#define StatusBadRequest 400                   // RFC 9110, 15.5.1
#define StatusUnauthorized 401                 // RFC 9110, 15.5.2
#define StatusPaymentRequired 402              // RFC 9110, 15.5.3
#define StatusForbidden 403                    // RFC 9110, 15.5.4
#define StatusNotFound 404                     // RFC 9110, 15.5.5
#define StatusMethodNotAllowed 405             // RFC 9110, 15.5.6
#define StatusNotAcceptable 406                // RFC 9110, 15.5.7
#define StatusProxyAuthRequired 407            // RFC 9110, 15.5.8
#define StatusRequestTimeout 408               // RFC 9110, 15.5.9
#define StatusConflict 409                     // RFC 9110, 15.5.10
#define StatusGone 410                         // RFC 9110, 15.5.11
#define StatusLengthRequired 411               // RFC 9110, 15.5.12
#define StatusPreconditionFailed 412           // RFC 9110, 15.5.13
#define StatusRequestEntityTooLarge 413        // RFC 9110, 15.5.14
#define StatusRequestURITooLong 414            // RFC 9110, 15.5.15
#define StatusUnsupportedMediaType 415         // RFC 9110, 15.5.16
#define StatusRequestedRangeNotSatisfiable 416 // RFC 9110, 15.5.17
#define StatusExpectationFailed 417            // RFC 9110, 15.5.18
#define StatusTeapot 418                       // RFC 9110, 15.5.19 (Unused)
#define StatusMisdirectedRequest 421           // RFC 9110, 15.5.20
#define StatusUnprocessableEntity 422          // RFC 9110, 15.5.21
#define StatusLocked 423                       // RFC 4918, 11.3
#define StatusFailedDependency 424             // RFC 4918, 11.4
#define StatusTooEarly 425                     // RFC 8470, 5.2.
#define StatusUpgradeRequired 426              // RFC 9110, 15.5.22
#define StatusPreconditionRequired 428         // RFC 6585, 3
#define StatusTooManyRequests 429              // RFC 6585, 4
#define StatusRequestHeaderFieldsTooLarge 431  // RFC 6585, 5
#define StatusUnavailableForLegalReasons 451   // RFC 7725, 3

#define StatusInternalServerError 500           // RFC 9110, 15.6.1
#define StatusNotImplemented 501                // RFC 9110, 15.6.2
#define StatusBadGateway 502                    // RFC 9110, 15.6.3
#define StatusServiceUnavailable 503            // RFC 9110, 15.6.4
#define StatusGatewayTimeout 504                // RFC 9110, 15.6.5
#define StatusHTTPVersionNotSupported 505       // RFC 9110, 15.6.6
#define StatusVariantAlsoNegotiates 506         // RFC 2295, 8.1
#define StatusInsufficientStorage 507           // RFC 4918, 11.5
#define StatusLoopDetected 508                  // RFC 5842, 7.2
#define StatusNotExtended 510                   // RFC 2774, 7
#define StatusNetworkAuthenticationRequired 511 // RFC 6585, 6

#endif