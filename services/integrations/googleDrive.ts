
export class GoogleDriveService {
    private static scriptsLoaded = false;
    private static tokenClient: any = null;
    private static pickerInited = false;
    private static accessToken: string | null = null;

    private static SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
    private static DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

    /**
     * Dynamically loads the necessary Google Scripts
     */
    private static async loadScripts(): Promise<void> {
        if (this.scriptsLoaded) return;

        return new Promise((resolve, reject) => {
            const gsiScript = document.createElement('script');
            gsiScript.src = 'https://accounts.google.com/gsi/client';
            gsiScript.async = true;
            gsiScript.defer = true;
            document.body.appendChild(gsiScript);

            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.async = true;
            gapiScript.defer = true;
            
            gapiScript.onload = () => {
                // @ts-ignore
                window.gapi.load('client:picker', async () => {
                    // @ts-ignore
                    await window.gapi.client.init({
                        discoveryDocs: this.DISCOVERY_DOCS,
                    });
                    this.pickerInited = true;
                    this.checkLoadStatus(resolve);
                });
            };
            
            gsiScript.onload = () => {
                this.checkLoadStatus(resolve);
            };

            gsiScript.onerror = (e) => reject(e);
            gapiScript.onerror = (e) => reject(e);

            document.body.appendChild(gapiScript);
        });
    }

    private static checkLoadStatus(resolve: () => void) {
        // @ts-ignore
        if (window.google && window.gapi && this.pickerInited) {
            this.scriptsLoaded = true;
            resolve();
        }
    }

    /**
     * Opens the Google Drive Picker
     * @param clientId The OAuth Client ID from Google Cloud Console
     * @param apiKey The Developer Key
     */
    static async pickFile(clientId: string, apiKey: string): Promise<File | null> {
        await this.loadScripts();

        return new Promise((resolve, reject) => {
            // @ts-ignore
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: this.SCOPES,
                callback: async (response: any) => {
                    if (response.error !== undefined) {
                        reject(response);
                        return;
                    }
                    this.accessToken = response.access_token;
                    this.createPicker(apiKey, resolve, reject);
                },
            });

            // Request permission if we don't have a valid token
            // @ts-ignore
            if (window.gapi.client.getToken() === null) {
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                this.tokenClient.requestAccessToken({ prompt: '' });
            }
        });
    }

    private static createPicker(apiKey: string, resolve: (f: File | null) => void, reject: (e: any) => void) {
        if (!this.accessToken) return;

        // @ts-ignore
        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes("image/png,image/jpeg,image/webp");

        // @ts-ignore
        const picker = new window.google.picker.PickerBuilder()
            // @ts-ignore
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            // @ts-ignore
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED) 
            .setDeveloperKey(apiKey)
            .setAppId(process.env.GOOGLE_PROJECT_ID || "") 
            .setOAuthToken(this.accessToken)
            .addView(view)
            // @ts-ignore
            .addView(new window.google.picker.DocsUploadView())
            .setCallback(async (data: any) => {
                // @ts-ignore
                if (data.action === window.google.picker.Action.PICKED) {
                    const fileId = data.docs[0].id;
                    const fileName = data.docs[0].name;
                    const mimeType = data.docs[0].mimeType;
                    
                    try {
                        const blob = await this.downloadFile(fileId);
                        const file = new File([blob], fileName, { type: mimeType });
                        resolve(file);
                    } catch (e) {
                        reject(e);
                    }
                // @ts-ignore
                } else if (data.action === window.google.picker.Action.CANCEL) {
                    resolve(null);
                }
            })
            .build();
        picker.setVisible(true);
    }

    /**
     * Downloads the file content using the Drive API
     */
    private static async downloadFile(fileId: string): Promise<Blob> {
        if (!this.accessToken) throw new Error("No access token");

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Drive Download Failed: ${response.statusText}`);
        }

        return await response.blob();
    }
}
