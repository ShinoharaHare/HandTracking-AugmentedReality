function createParamsCreator<T>(defaultParams: T): (params?: Partial<T>) => T {
    return (params) => Object.assign({}, defaultParams, params)
}

const defaultMarkerParams = {
    // size of the marker in meter
    size: 1,
    // type of marker - ['pattern', 'barcode', 'unknown' ]
    type: 'unknown' as 'pattern' | 'barcode' | 'unknown',
    // url of the pattern - IIF type='pattern'
    patternUrl: null as string | null,
    // value of the barcode - IIF type='barcode'
    barcodeValue: null as string | null,
    // change matrix mode - [modelViewMatrix, cameraTransformMatrix]
    changeMatrixMode: 'modelViewMatrix' as 'modelViewMatrix' | 'cameraTransformMatrix',
    // turn on/off camera smoothing
    smooth: true,
    // number of matrices to smooth tracking over, more = smoother but slower follow
    smoothCount: 5,
    // distance tolerance for smoothing, if smoothThreshold # of matrices are under tolerance, tracking will stay still
    smoothTolerance: 0.01,
    // threshold for smoothing, will keep still unless enough matrices are over tolerance
    smoothThreshold: 2,
}
export type MarkerParams = typeof defaultMarkerParams
export const createMarkerParams = createParamsCreator(defaultMarkerParams)

const defaultContextParams = {
    // debug - true if one should display artoolkit debug canvas, false otherwise
    debug: false,
    // the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
    detectionMode: 'color_and_matrix' as
        | 'color'
        | 'color_and_matrix'
        | 'mono'
        | 'mono_and_matrix',
    // type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
    matrixCodeType: '3x3' as
        | '3x3'
        | '3x3_HAMMING63'
        | '3x3_PARITY65'
        | '4x4'
        | '4x4_BCH_13_9_3'
        | '4x4_BCH_13_5_5',
    // Pattern ratio for custom markers
    patternRatio: 0.5,
    // Labeling mode for markers - ['black_region', 'white_region']
    // black_region: Black bordered markers on a white background, white_region: White bordered markers on a black background
    labelingMode: 'black_region' as 'black_region' | 'white_region',

    // url of the camera parameters
    cameraParametersUrl: 'camera_para.dat',

    // tune the maximum rate of pose detection in the source image
    maxDetectionRate: 60,
    // resolution of at which we detect pose in the source image
    canvasWidth: 640,
    canvasHeight: 480,

    // enable image smoothing or not for canvas copy - default to true
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
    imageSmoothingEnabled: true,
}
export type ContextParams = typeof defaultContextParams
export const createContextParams = createParamsCreator(defaultContextParams)

const defaultSourceParams = {
    // type of source - ['webcam', 'image', 'video']
    sourceType: 'webcam' as 'webcam' | 'image' | 'video',
    // url of the source - valid if sourceType = image|video
    sourceUrl: null as string | null,

    // resolution of at which we initialize the source image
    sourceWidth: 640,
    sourceHeight: 480,
    // resolution displayed for the source
    displayWidth: 640,
    displayHeight: 480,
}
export type SourceParams = typeof defaultSourceParams
export const createSourceParams = createParamsCreator(defaultSourceParams)
