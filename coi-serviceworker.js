/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
    self.addEventListener("message", (ev) => {
        if (!ev.data) {
            return;
        } else if (ev.data.type === "deregister") {
            self.registration.unregister();
        }
    });

    self.addEventListener("fetch", function (event) {
        const r = event.request;
        if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
            return;
        }

        const request = (coepCredentialless && r.mode === "no-cors")
            ? new Request(r, {
                credentials: "omit",
            })
            : r;
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy",
                        coepCredentialless ? "credentialless" : "require-corp");
                    if (!coepCredentialless) {
                        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                    }

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });
} else {
    (async function () {
        if (window.crossOriginIsolated !== false) return;

        const registration = await navigator.serviceWorker.register(window.document.currentScript.src).catch((e) => console.error("COI: ", e));
        if (registration) {
            console.log("COI: registered");
            registration.addEventListener("updatefound", () => {
                console.log("COI: update found, reloading");
                window.location.reload();
            });

            if (registration.active && !navigator.serviceWorker.controller) {
                console.log("COI: active, reloading");
                window.location.reload();
            }
        }
    })();
}
