(function(window)
{
    'use strict';

    /**
     * Maze class
     * @param wrapper
     * @param button
     */
    function ThreeMaze(wrapper, button)
    {
        
        // Object attributes
        this.wrapper = wrapper;
        this.camera = {};
        this.cameraHelper = {};
        this.scene = {};
        this.materials = {};
        this.map = [];
        this.renderer = {};
        this.player = {};
        this.end = {};
        this.side = 31;
        this.thickness = 20;

        // Inits
        this.initScene();
        this.onWindowResize();
        this.initAudio();
        this.render();

        // Events
        this.wrapper.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.wrapper.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.wrapper.addEventListener('mouseup', this.onMouseUp.bind(this));
        button.addEventListener('click', this.onGenerateMaze.bind(this));
        button.dispatchEvent(new Event('click'));
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));

        this.startTime = 0;
        this.endTime = 0;
   
        // Create HTML element for timer display
        this.timerElement = document.createElement('div');
        this.timerElement.style.position = 'absolute';
        this.timerElement.style.top = '10px';
        this.timerElement.style.left = '10px';
        this.wrapper.appendChild(this.timerElement);

        // Start the animation loop
        this.updateTimerLoop();

        let levelIndex = 0;
        const totalLevels = 3;
        
        // Create an Audio object and set the source to your sound file
        const clickSound = new Audio('sheepsound.mp3'); // Replace with the path to your sound file
        
        button.addEventListener('click', () => {
            // Play the sound
            clickSound.play();
        
            if (levelIndex < totalLevels) {
                // Start the timer when the maze is generated
                this.startTime = performance.now();
                this.updateTimerDisplay(); // Update timer display immediately
        
                this.onGenerateMaze(levelIndex);
                button.textContent = `Start Level ${levelIndex + 1}`;
                levelIndex++;
            } else {
                // If completed all levels, restart
                levelIndex = 0;
                button.textContent = 'Start Over';
            }
        });
        
        // Start the first level by default
        button.click();

        var mazeGame = new ThreeMaze(document.getElementById('wrapper'), document.querySelector('.generate'));

    };


    ThreeMaze.prototype.initAudio = function () {
        this.audio = new Audio('../../sheepsound.mp3'); // Replace with the path to your sound file
    };


    ThreeMaze.prototype.playEndSound = function () {
        if (this.audio) {
            this.audio.play();
        }
    };


/**
 * Generates a new maze
 * Loops into the maze, removes old blocks and adds new ones
 */
ThreeMaze.prototype.generateRandomSpheres = function (levelIndex) {
    this.addSpheresToMaze(this.map, levelIndex);
};

ThreeMaze.prototype.generateRandomSpheres = function () {
    this.addSpheresToMaze(this.map);
};

ThreeMaze.prototype.addSpheresToMaze = function (maze) {
    var numSpheres = 10; // You can adjust the number of spheres

    for (var i = 0; i < numSpheres; i++) {
        var randomX, randomZ;

        // Retry until a valid path position is found
        do {
            randomX = Math.floor(Math.random() * this.side);
            randomZ = Math.floor(Math.random() * this.side);
        } while (maze[randomX][randomZ] !== 0);

        var sphere = new THREE.Mesh(
            new THREE.SphereGeometry(this.thickness / 2, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0xFF0000 })
        );
        sphere.position.set(
            randomX * this.thickness - ((this.side * this.thickness) / 2),
            this.thickness / 2,
            randomZ * this.thickness - ((this.side * this.thickness) / 2)
        );
        this.scene.add(sphere);
    }
};
    
    ThreeMaze.prototype.onGenerateMaze = function(levelIndex)   
    {
        
        // Animates the end block
        var end_hide_tween = new TWEEN.Tween({ scale: 1, y: this.thickness / 2, mesh: this.end }).to({ scale: 0, y: 0 }, 300);
        var end_show_tween = new TWEEN.Tween({ scale: 0, y: 0, mesh: this.end }).to({
            scale: 1,
            y: this.thickness / 2
        }, 300).delay((this.side * 2) * latency);

        


        // Modify the end_show_tween.onComplete function to play the sound
        end_show_tween.onComplete(function () {
            this.mesh.visible = false;
            // Play the sound when the player reaches the end
            this.playEndSound();
        });
        var new_map = this.generateMaze(this.side);
        var new_player_path = [];
        var latency = 50;
        var self = this;
        var tween = null;
        for (var x = this.side; x > 0; x -= 1)
        {
            new_player_path[x] = [];
            for (var y = 1; y < this.side + 1; y += 1)
            {
                var delay = ((this.side - x) * latency) + ((this.side - y) * latency);
                // Inits player path
                new_player_path[x][y] = false;


                // Removes old mesh if needed
                if (typeof this.map[x] != 'undefined' && typeof this.map[x][y] != 'undefined' && typeof this.map[x][y] === 'object')
                {
                    tween = new TWEEN.Tween({scale: 1, y: this.thickness / 2, mesh: this.map[x][y]}).to({scale: 0, y: 0}, 200).delay(delay);
                    tween.onUpdate(this.onUpdateTweeningMesh);
                    tween.onComplete(function()
                    {
                        this.mesh.visible = false;
                        self.scene.remove(this.mesh);
                    });
                    tween.start();
                }


                // Removes player path if needed
                if (typeof this.player.path != 'undefined' && typeof this.player.path[x] != 'undefined' && typeof this.player.path[x][y] != 'undefined' && typeof this.player.path[x][y] === 'object')
                {
                    this.removePlayerPath(x, y, delay);
                }


                // Adds a new mesh if needed
                if (new_map[x][y] === 0)
                {
                    // Generates the mesh
                    var wall_geometry = new THREE.CubeGeometry(this.thickness, this.thickness, this.thickness, 1, 1, 1);
                    new_map[x][y] = new THREE.Mesh(wall_geometry, this.materials.grey);
                    new_map[x][y].visible = false;
                    new_map[x][y].position.set(x * this.thickness - ((this.side * this.thickness) / 2), 0, y * 20 - ((this.side * this.thickness) / 2));
                    this.scene.add(new_map[x][y]);




                    // Builds the related tween
                    tween = new TWEEN.Tween({scale: 0, y: 0, mesh: new_map[x][y]}).to({scale: 1, y: this.thickness / 2}, 300).delay(delay);
                    tween.onUpdate(this.onUpdateTweeningMesh);
                    tween.onStart(function()
                    {
                        this.mesh.visible = true;
                    });
                    tween.start();
                }
                else
                {
                    new_map[x][y] = false;
                }

            }
        }


        // Animates the end block
        var end_hide_tween = new TWEEN.Tween({scale: 1, y: this.thickness / 2, mesh: this.end}).to({scale: 0, y: 0}, 300);
        var end_show_tween = new TWEEN.Tween({scale: 0, y: 0, mesh: this.end}).to({
            scale: 1,
            y: this.thickness / 2
        }, 300).delay((this.side * 2) * latency);
        end_hide_tween.onUpdate(this.onUpdateTweeningMesh);
        end_show_tween.onUpdate(this.onUpdateTweeningMesh);
        end_show_tween.onStart(function()
        {
            this.mesh.visible = true;
        });
        end_hide_tween.onComplete(function()
        {
            this.mesh.visible = false;
        });
        if (this.end.scale != 0)
        {
            end_hide_tween.start();
        }
        end_show_tween.start();


        this.map = new_map;
        this.player.path = new_player_path;


        // Inits player
        this.player.mazePosition = {x: this.side - 1, z: this.side - 1};
        this.movePlayer(false);
       
        // Start the timer when the maze is generated
        this.startTime = performance.now();
        this.updateTimerDisplay(); // Update timer display immediately

// Inside ThreeMaze.prototype.onGenerateMaze function
if (this.player.mazePosition.x === 2 && this.player.mazePosition.z === 2) {
    // ... (other code)
    this.endTime = performance.now();
    var totalTime = (this.endTime - this.startTime) / 1000;
    this.updateMazeCompletionTime(totalTime); // This will trigger the mazeCompleted event
    this.onGenerateMaze();
}


    };
    ThreeMaze.prototype.updateMazeCompletionTime = function () {
        var totalTime = (this.endTime - this.startTime) / 1000; // Convert to seconds
    
        // Update the maze completion time for the logged-in user
        this.updateUserMazeCompletionTime(totalTime);
    
        // Display the total time in a message box
        window.alert('Congratulations! You completed the maze in ' + totalTime.toFixed(2) + ' seconds');
    };
    
    ThreeMaze.prototype.updateUserMazeCompletionTime = function (mazeCompletionTime) {
        var loggedInUserEmail = sessionStorage.getItem("currentUser"); // Retrieve the logged-in user's email from session storage
        var allUserDetails = JSON.parse(localStorage.getItem("allUserDetails")) || {};
    
        if (loggedInUserEmail && allUserDetails[loggedInUserEmail]) {
            // Update the maze completion time for the logged-in user
            allUserDetails[loggedInUserEmail].mazeCompletionTime = mazeCompletionTime;
    
            // Save the updated user details back to local storage
            localStorage.setItem("allUserDetails", JSON.stringify(allUserDetails));
    
            // Log to check if the maze completion time is updated
            console.log('Maze completion time updated:', allUserDetails[loggedInUserEmail].mazeCompletionTime);
    
            // Trigger custom event for maze completion
            var mazeCompletedEvent = new Event('mazeCompleted');
            document.dispatchEvent(mazeCompletedEvent);
        } else {
            // Log an error if the user's email is not found in session storage or allUserDetails
            console.error('Logged-in user email not found or user not in allUserDetails.');
        }
    };
    
    /**
     * Updates a mesh when doing a tween
     */
    ThreeMaze.prototype.onUpdateTweeningMesh = function()
    {
        this.mesh.scale.y = this.scale;
        this.mesh.position.y = this.y;
    };


    /**
     * Removes a mesh from the player path
     * @param x
     * @param y
     * @param delay
     */
    ThreeMaze.prototype.removePlayerPath = function(x, y, delay)
    {
        var tween = new TWEEN.Tween({scale: 1, y: this.thickness / 8, mesh: this.player.path[x][y]}).to({
            scale: 0,
            y: this.thickness * 5
        }, 300).delay(delay);
        var self = this;
        this.player.path[x][y] = false;
        tween.onUpdate(function()
        {
            this.mesh.scale.set(this.scale, this.scale, this.scale);
            this.mesh.position.y = this.y;
        });
        tween.onComplete(function()
        {
            self.scene.remove(this.mesh);
        });
        tween.onStart(function()
        {
            this.mesh.visible = true;
        });
        tween.start();
    };

    /**
     * Inits the scene
     */
    ThreeMaze.prototype.initScene = function()
    {
        // Scene
        this.scene = new THREE.Scene();

        // Materials
        this.materials =
        {
            grey: new THREE.MeshLambertMaterial({color: 0xFF69B8, wireframe: true}),
            red: new THREE.MeshLambertMaterial({color: 0xFFFF00, ambient: 0xFFFF00, lineWidth: 1})
        };

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, 1, 1, 2000);
        this.camera.clicked = false;

        // Lights
        this.scene.add(new THREE.AmbientLight(0xc9c9c9));
        var directional = new THREE.DirectionalLight(0xc9c9c9, 0.5);
        directional.position.set(0, 0.5, 1);
        this.scene.add(directional);

      
        // Player
        this.player = new THREE.Mesh(new THREE.SphereGeometry(this.thickness / 2, 9, 9),this.materials.red), new THREE.MeshLambertMaterial({ color: 0xffff00, wireframe: false });
        this.player.position.y = this.thickness * 1.5;
        this.scene.add(this.player);

        // End of the maze
        this.end = new THREE.Mesh(new THREE.CubeGeometry(this.thickness, this.thickness, this.thickness, 1, 1, 1), this.materials.red);
        this.end.position.set(-((this.side / 2) * this.thickness) + (this.thickness * 2), 0, -((this.side / 2) * this.thickness) + (this.thickness * 2));
        this.end.scale.y = 0;
        this.end.visible = false;
        this.scene.add(this.end);


        // Camera helper
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.sqrt(3) * (this.side * this.thickness)), 0, 0);
        this.cameraHelper = new THREE.Line(geometry);
        this.scene.add(this.cameraHelper);
        this.cameraHelper.visible = false;
        this.cameraHelper.targetRotation = false;
        this.cameraHelper.rotation.set(0, 1.362275, 0.694716);


        // Renderer
        this.renderer = typeof WebGLRenderingContext != 'undefined' && window.WebGLRenderingContext ? new THREE.WebGLRenderer({antialias: true}) : new THREE.CanvasRenderer({});
        this.wrapper.appendChild(this.renderer.domElement);
    };

    /**
     * Keydown action
     * @param evt
     */
    ThreeMaze.prototype.onKeyDown = function(evt)
    {
        // Gets the direction depending on the pressed key
        var code = evt.keyCode;
        var direction = {x: 0, z: 0};
        var directions =
        {
            37: {x: 1, z: 0},
            39: {x: -1, z: 0},
            38: {x: 0, z: 1},
            40: {x: 0, z: -1}
        };
        if (typeof directions[code] != 'undefined')
        {
            direction = directions[code];
        }
        else
        {
            return;
        }


        var x = this.player.mazePosition.x;
        var z = this.player.mazePosition.z;
        var target_block = this.map[x + direction.x][z + direction.z];
        if (target_block === false)
        {
            // If the player moves forward, adds a block to the path
            if (this.player.path[x + direction.x][z + direction.z] === false)
            {
                // Builds the mesh
                this.player.path[x][z] = new THREE.Mesh(new THREE.CubeGeometry(this.thickness, this.thickness / 4, this.thickness, 1, 1, 1), this.materials.red);
                this.player.path[x][z].position.set(-((this.side * this.thickness) / 2) + x * this.thickness, this.thickness * 5, -((this.side * this.thickness) / 2) + z * this.thickness);
                this.player.path[x][z].scale.set(0, 0, 0);
                this.scene.add(this.player.path[x][z]);


                // Builds the related tween
                var tween = new TWEEN.Tween({scale: 0, y: this.thickness * 5, mesh: this.player.path[x][z]}).to({
                    scale: 1,
                    y: this.thickness / 8
                }, 300).delay(150);
                tween.onUpdate(function()
                {
                    this.mesh.scale.set(this.scale, this.scale, this.scale);
                    this.mesh.position.y = this.y;
                });
                tween.start();
            }
            // If he goes back, removes one
            else
            {
                this.removePlayerPath(x + direction.x, z + direction.z, 0);
            }


            // Updates the player position
            this.player.mazePosition.x += direction.x;
            this.player.mazePosition.z += direction.z;


            this.movePlayer(true);
        }
    };


    /**
     * Moves the player depending on its position on the maze
     * @param animate
     */
    ThreeMaze.prototype.movePlayer = function(animate)
    {
        var from = { height: -Math.PI, x: this.player.position.x, z: this.player.position.z, mesh: this.player };
        var to = {
            height: Math.PI,
            x: -((this.side * this.thickness) / 2) + this.player.mazePosition.x * this.thickness,
            z: -((this.side * this.thickness) / 2) + this.player.mazePosition.z * this.thickness
        };
        var tween = new TWEEN.Tween(from).to(to, animate ? 300 : 0);
        var self = this;
        var isFirstMove = this.startTime === 0; // Check if it's the first move
    
        tween.onUpdate(function () {
            this.mesh.position.x = this.x;
            this.mesh.position.y = (Math.cos(this.height) + 1) * (self.thickness / 4);
            this.mesh.position.z = this.z;
        });
    
        // Start the timer on the first move
        if (isFirstMove) {
            this.startTime = performance.now();
            this.updateTimerDisplay(); // Update timer display immediately
            this.updateTimerLoop(); // Start the animation loop for the timer
        }
    
        // End of the maze: starts again
        tween.onComplete(function () {
            if (self.player.mazePosition.x === 2 && self.player.mazePosition.z === 2) {
                self.onGenerateMaze();
            }
        });
        tween.start();

        tween.onComplete(function () {
            if (self.player.mazePosition.x === 2 && self.player.mazePosition.z === 2) {
                self.endTime = performance.now();
                var totalTime = (self.endTime - self.startTime) / 1000; // Convert to seconds
                console.log('Total Time:', totalTime);
                self.updateMazeCompletionTime(totalTime); // Call the function to update maze completion time
                self.onGenerateMaze();
            }
        });


    };
    ThreeMaze.prototype.updateTimerDisplay = function () {
        // Update the timer display with the elapsed time
        var currentTime = performance.now();
        var elapsedTime = (currentTime - this.startTime) / 1000; // Convert to seconds
        this.timerElement.innerHTML = 'Elapsed time: ' + elapsedTime.toFixed(2) + ' seconds';
    };


    ThreeMaze.prototype.updateTimerLoop = function () {
        // Update the timer in the animation loop
        this.updateTimerDisplay();
        requestAnimationFrame(this.updateTimerLoop.bind(this));
    };
   

    /**
     * Moving the mouse over the container: sets a target rotation for the camera helper
     * @param evt
     */
    ThreeMaze.prototype.onMouseMove = function(evt)
    {
        if (this.camera.clicked !== false)
        {
            var target_rotation = {
                z: this.cameraHelper.rotation.z + ((evt.pageY - this.camera.clicked.y) / 800),
                y: this.cameraHelper.rotation.y + ((this.camera.clicked.x - evt.pageX) / 800)
            };
            if (target_rotation.z < 0)
            {
                target_rotation.z = 0;
            }
            if (target_rotation.z > (Math.PI / 2) - 0.1)
            {
                target_rotation.z = Math.PI / 2 - 0.1;
            }
            this.cameraHelper.targetRotation = target_rotation;
        }
    };


    /**
     * Mouse down: starts dragging the maze
     * @param evt
     */
    ThreeMaze.prototype.onMouseDown = function(evt)
    {
        evt.preventDefault();
        this.camera.clicked = {x: evt.pageX, y: evt.pageY};
    };

    /**
     * Mouse up: stops dragging the maze
     * @param evt
     */
    ThreeMaze.prototype.onMouseUp = function(evt)
    {
        evt.preventDefault();
        this.camera.clicked = false;
    };


    /**
     * Render loop
     * Sets the camera position and renders the scene
     */
    ThreeMaze.prototype.render = function()
    {
        requestAnimationFrame(this.render.bind(this));
        TWEEN.update();
        if (this.cameraHelper.targetRotation !== false)
        {
            this.cameraHelper.rotation.z += (this.cameraHelper.targetRotation.z - this.cameraHelper.rotation.z) / 10;
            this.cameraHelper.rotation.y += (this.cameraHelper.targetRotation.y - this.cameraHelper.rotation.y) / 10;
        }
        this.camera.position = this.cameraHelper.geometry.vertices[1].clone().applyProjection(this.cameraHelper.matrixWorld);
        this.camera.lookAt(this.scene.position);
        this.renderer.render(this.scene, this.camera);
    };

    /**
     * Sets the scene dimensions on window resize
     */
    ThreeMaze.prototype.onWindowResize = function()
    {
        var width = window.innerWidth || window.document.body.clientWidth;
        var height = window.innerHeight || window.document.body.clientHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    };



    window.ThreeMaze = ThreeMaze;

})(window);
