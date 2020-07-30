if (!Date.now) Date.now = function() { return new Date().getTime(); };

function init() {
	var renderer, scene, pointLight, camera, controls, stats, clock, particles, geometries;
	
	function Settings() {
		this.cameraFOV = 50.0;
		this.cameraDistance = 400.0;
		this.cameraDistanceMin = 50.0;
		this.cameraDistanceMax = 500.0;
		
		this.charactersNum = 26;
		
		this.statsenabled = true;
	}
	var settings = new Settings();

	var GUISettings = {
		spaceSize: 500,
		pointSize: 20,
		particlesPerCharacterNum: 2000 // 200
		// 10.000 particles total at 23fps (shapes), 130.000 particles (5000 * 26) at 26 fps (PointCloudMaterial)
	};
	
	Trace.init({ showLineNumbers: true });
	jQuery('#trace').css('color', '#888');
	jQuery('#trace').css('top', '45px');
	
	if(settings.statsenabled) {
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		$('body').append(stats.domElement);
	}
	
	clock = new THREE.Clock();
	
	var container = document.createElement( 'div' );
	document.body.appendChild( container );
	
	if( Detector.webgl ){
		renderer = new THREE.WebGLRenderer({
			alpha: false,
			clearAlpha: 1,
			sortObjects: false
		});
		// renderer.setClearColor( 0x000000, 1 );
		
	} else {
		renderer = new THREE.CanvasRenderer();
	}
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x000000, 1, 1500 );
	
	scene.add( new THREE.AmbientLight( 0x444444 ) );

	pointLight = new THREE.PointLight(0xFFFFFF);
	pointLight.position.x = 0.0;
	pointLight.position.y = 0.0;
	pointLight.position.z = 1000.0;
	pointLight.intensity = 1.0;
	// pointLight.distance = 1000.0;
	scene.add(pointLight);
	
	camera = new THREE.PerspectiveCamera(settings.cameraFOV, window.innerWidth / window.innerHeight, 1, 3000);
	camera.position.x = 0.0;
	camera.position.y = 0.0;
	camera.position.z = settings.cameraDistance;
	scene.add(camera);

	initGUI();
	
	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.rotateSpeed = 0.5; // 1.0
	controls.zoomSpeed = 1.0;
	controls.panSpeed = 0.25;

	controls.noRotate = false;
	controls.noZoom = false;
	controls.noPan = true;

	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.2;

	controls.minDistance = settings.cameraDistanceMin;
	controls.maxDistance = settings.cameraDistanceMax;
	
	controls.keys = []; // [ 65 // A, 83 // S, 68 // D ]; // [ rotateKey, zoomKey, panKey ]
	controls.enabled = true;

	var cube = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 2 ), new THREE.MeshBasicMaterial( {color: 0xff0000} ) );
	cube.position.z = 0;
	scene.add( cube );
	
	var geometries;
	var pointClouds;

	var letters = [];
	var materials = [];

	for(var i = 0; i < settings.charactersNum; i++) {
		//create image
		var text = String.fromCharCode(97 + i);
		var bitmap = document.createElement('canvas');
		var context = bitmap.getContext('2d');
		bitmap.width = 256;
		bitmap.height = 256;
		context.font = '200 200px Raleway';
		var charWidth = context.measureText(text).width;
		context.clearRect(0,0,bitmap.width,bitmap.height);
		// context.fillStyle = 'red';
		// context.fillRect(0, 0, bitmap.width, bitmap.height);
		context.fillStyle = 'white';
		context.fillText(text, (bitmap.width - charWidth) / 2, 175);
		// canvas contents will be used for a texture
		var texture = new THREE.Texture(bitmap) 
		texture.needsUpdate = true;
		// var m = new THREE.MeshBasicMaterial({ map : texture, transparent: true });
		materials[i] = new THREE.PointCloudMaterial( { size: 20, map: texture, blending: THREE.AdditiveBlending, depthTest: false, transparent : true } );
		// m.color.setHSL( color[0], color[1], color[2] );
	}

	createParticles();


	function createParticles() {
		var timeStart = Date.now();

		for(var i = 0; i < materials.length; i++) {
			materials[i].size = GUISettings.pointSize;
		}

		if(pointClouds !== undefined) {
			for(var i = 0; i < pointClouds.length; i++) {
				scene.remove( pointClouds[i] );
			}
		}

		geometries = [];
		pointClouds = [];

		for(var i = 0; i < settings.charactersNum; i++) {
			geometries[i] = new THREE.Geometry();
			for(var p = 0; p < parseInt(GUISettings.particlesPerCharacterNum); p++) {
				var vertex = new THREE.Vector3();
				vertex.x = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
				vertex.y = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
				vertex.z = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
				// vertex.setLength(Math.random() * GUISettings.spaceSize / 2);
				geometries[i].vertices.push( vertex );
			}
		}

		/*
		geometry = new THREE.Geometry();
		for(var i = 0; i < settings.particlesPerCharacterNum; i++) {
			var vertex = new THREE.Vector3();
			vertex.x = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
			vertex.y = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
			vertex.z = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;

			geometry.vertices.push( vertex );
		}
		*/
		
		for(var i = 0; i < settings.charactersNum; i++) {
			pointClouds[i] = new THREE.PointCloud( geometries[i], materials[i] );
			// particles.rotation.x = Math.random() * 0.2;
			// particles.rotation.y = Math.random() * 6;
			// particles.rotation.z = Math.random() * 6;
			scene.add( pointClouds[i] );
		}
		
		trace( parseInt(GUISettings.particlesPerCharacterNum) * settings.charactersNum + " points created in " + (Date.now() - timeStart)  + " ms" );

	}
	
	window.addEventListener( 'resize', onWindowResize, false );
	onWindowResize();
	
	function onWindowResize() {
		// trace("onWindowResize()");

		var viewportWidth = window.innerWidth;
		var viewportHeight = window.innerHeight;
		
		// $('#trace').css('height', (viewportHeight - 100) + 'px');
		
		camera.aspect = viewportWidth / viewportHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( viewportWidth, viewportHeight );

		if(typeof controls !== 'undefined') {
			controls.screen.width = viewportWidth;
			controls.handleResize();
		}
		
		render();
	}
	
	function render() {
		var delta = clock.getDelta();
		
		delta = Math.min(delta, 0.1);
	
		for(var g = 0; g < geometries.length; g++) {
			for(var i = 0; i < geometries[g].vertices.length; i++) {
				var v = geometries[g].vertices[i];
			
				v.y -= 10 * delta;
				// letters[i].rotation.y += letters[i].rotationSpeedY * delta;
			
				if(v.y < -GUISettings.spaceSize/2) {
					// letters[i].position.x = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
					v.y = GUISettings.spaceSize/2 + Math.random() * GUISettings.spaceSize/4 - GUISettings.spaceSize/8;
					// letters[i].position.z = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
				}
			
			}
			geometries[g].verticesNeedUpdate = true;
		}

		pointLight.position = camera.position;
		
		renderer.render( scene, camera );
	
		if(typeof controls !== 'undefined') {
			controls.update();
		}
		
	}
	
	function animate() {
		requestAnimationFrame(animate);

		if(typeof stats !== 'undefined') stats.update();
		
		render();
	}
	animate();


	function initGUI() {
		var gui = new dat.GUI({ width: 400 });

		gui.add(GUISettings, 'spaceSize', 10, 1000).onChange( createParticles );
		gui.add(GUISettings, 'pointSize', 1, 100).onChange( createParticles );
		gui.add(GUISettings, 'particlesPerCharacterNum', 1, 20000).onChange( createParticles );

	}

	
}

$(window).load(function() {

	init();

});

