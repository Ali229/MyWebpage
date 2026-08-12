import {DownloadRequestDialogComponent} from './download-request-dialog.component';

describe('DownloadRequestDialogComponent', () => {
    it('reports monitoring instead of claiming an immediate search for an unreleased movie', async () => {
        const auth = {
            getCurrentUserIdToken: jasmine.createSpy().and.resolveTo('token')
        };
        const downloadService = {
            downloadTitle: jasmine.createSpy().and.resolveTo({
                ok: true,
                added: true,
                title: 'Future Movie',
                minimumAvailability: 'released',
                searchNow: false
            }),
            markTracked: jasmine.createSpy()
        };
        const toastr = {
            info: jasmine.createSpy(),
            success: jasmine.createSpy(),
            error: jasmine.createSpy()
        };
        const component = new DownloadRequestDialogComponent(auth as any, downloadService as any, toastr as any);
        component.title = {id: 123, media_type: 'movie', title: 'Future Movie'} as any;
        component.open = true;

        await component.submit();

        expect(toastr.success).toHaveBeenCalledOnceWith(
            'Added and monitored. Automatic searching will begin when Radarr considers the movie released.'
        );
        expect(downloadService.markTracked).toHaveBeenCalledWith(component.title);
    });
});
