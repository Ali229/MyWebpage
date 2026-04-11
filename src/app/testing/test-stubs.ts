import {BehaviorSubject} from 'rxjs';

export function createAuthServiceStub() {
    const authStateReady$ = new BehaviorSubject(true);
    const streamableOnly$ = new BehaviorSubject(true);

    return {
        user: {
            uid: null,
            displayName: '',
            email: '',
            myCustomData: '',
            photoURL: ''
        },
        watchlist: [],
        empty: false,
        moviesCount: 0,
        tvCount: 0,
        providers: [],
        settingsLoaded: true,
        bShowStreamableOnly: false,
        authStateReady$: authStateReady$.asObservable(),
        bShowStreamableCheckbox$: streamableOnly$.asObservable(),
        getWatchlisted: jasmine.createSpy('getWatchlisted').and.returnValue(false),
        addToWatchlist: jasmine.createSpy('addToWatchlist'),
        removeFromWatchlist: jasmine.createSpy('removeFromWatchlist'),
        saveSettings: jasmine.createSpy('saveSettings'),
        saveStreamableOnlySetting: jasmine.createSpy('saveStreamableOnlySetting'),
        signOut: jasmine.createSpy('signOut'),
        googleSignin: jasmine.createSpy('googleSignin')
    };
}

export function createTitleServiceStub() {
    const title$ = new BehaviorSubject(null);

    return {
        loading: false,
        error: false,
        errorTitle: '',
        title$: title$.asObservable(),
        search: jasmine.createSpy('search'),
        multiSearch: jasmine.createSpy('multiSearch'),
        getRatingColor: jasmine.createSpy('getRatingColor').and.returnValue('secondary')
    };
}

export function createPopularServiceStub() {
    return {
        popularList: [],
        popularMovies: [],
        popularTVShows: [],
        selectedType: 'movie',
        loadingPopular: false,
        pruneProviderCache: jasmine.createSpy('pruneProviderCache'),
        getCachedProviders: jasmine.createSpy('getCachedProviders').and.returnValue(null),
        cacheProviders: jasmine.createSpy('cacheProviders'),
        pruneRatingCache: jasmine.createSpy('pruneRatingCache'),
        getCachedRating: jasmine.createSpy('getCachedRating').and.returnValue(null),
        cacheRating: jasmine.createSpy('cacheRating')
    };
}

export function createToastrServiceStub() {
    return {
        success: jasmine.createSpy('success'),
        info: jasmine.createSpy('info'),
        error: jasmine.createSpy('error')
    };
}
