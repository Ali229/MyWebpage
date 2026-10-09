import {of} from 'rxjs';
import {DownloadService} from './download.service';

describe('DownloadService', () => {
    const title = {
        id: 285322,
        media_type: 'tv',
        name: 'Below',
        external_ids: {tvdb_id: 480205}
    } as any;

    it('sends distinct TMDB and TVDB identifiers with the title for TV requests', async () => {
        const http = {post: jasmine.createSpy().and.returnValue(of({ok: true}))};
        const service = new DownloadService(http as any);
        await service.downloadTitle(title, 'token', {quality: '4k', monitor: 'all'});
        expect(http.post.calls.mostRecent().args[0]).toMatch(/\/download\/tv$/);
        expect(http.post.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
            tmdbId: 285322, tvdbId: 480205, title: 'Below'
        }));
    });

    it('supplies the same lookup hints for tracking status without marking an unrelated show tracked', async () => {
        const http = {post: jasmine.createSpy().and.returnValue(of({
            ok: true, statuses: [{tmdbId: 285322, mediaType: 'tv', tracked: false}]
        }))};
        const service = new DownloadService(http as any);
        await service.checkTrackingStatus([title], 'token');
        expect(http.post.calls.mostRecent().args[1].titles[0]).toEqual({
            tmdbId: 285322, mediaType: 'tv', tvdbId: 480205, title: 'Below'
        });
        expect(service.isTracked(title)).toBeFalse();
    });
});
