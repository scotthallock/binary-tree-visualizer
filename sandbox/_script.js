const startApp = () => {
    /**
     * Definition for a binary tree node.
     */
    class TreeNode {
        constructor (val, left, right) {
            this.val = (val===undefined ? 0 : val);
            this.left = (left===undefined ? null : left);
            this.right = (right===undefined ? null : right);
        }

        static traverse(root, path) {
            let node = root;
            while (path.length > 0) {
                if (path[0] === 'l') {
                    node = node.left;
                }
                else if (path[0] === 'r') {
                    node = node.right;
                }
                else {
                    throw new Error (`Traversal path string can only contain 'l' or 'r'.`);
                }
                path = path.slice(1);
            }
            return node;
        }

        static traverseToParent(root, path) {
            return TreeNode.traverse(root, path.slice(0, path.length-1));
        }

        delete(path) {
            if (path === '') console.log('hey you clicked the root')
            let root = this;
            const parent = TreeNode.traverseToParent(root, path);
            const next = path[path.length - 1];
            if (next === 'l') {
                parent.left = null;
            } else if (next === 'r') {
                parent.right = null;
            } else {
                throw new Error (`Traversal path string can only contain 'l' or 'r'.`);
            }
        }

        insert(path, value = 0) {
            let root = this;
            const parent = TreeNode.traverseToParent(root, path);
            const next = path[path.length - 1];
            if (next === 'l') {
                parent.left = new TreeNode(value);
            } else if (next === 'r') {
                parent.right = new TreeNode(value);
            } else {
                throw new Error (`Traversal path string can only contain 'l' or 'r'.`);
            }
        }

        static maxDepth(root) {
            if (root === null) return 0;
            return Math.max(this.maxDepth(root.left), this.maxDepth(root.right)) + 1;
        }
    }

    const buildTreeFromArrString = (arrString) => {
        $alertContainer.classList.remove('active');

        // replace single with double quotes, remove whitespaces
        arrString = arrString.replace(/'/g, '"').replace(/\s/g, ''); 
        // remove extra brackets and re-add at ends
        arrString = '[' + arrString.replace(/[\[\]]+/g, '') + ']'; 
        $treeArrayInput.innerText = arrString;

        if (arrString === '[]') return null;

        try {
            arr = JSON.parse(arrString);
        } catch (e) {
            console.log(e);
            $alertContainer.classList.add('active');
            $alertContainer.innerHTML = `<span id="error-message">${e}</span>`
            return binaryTreeRoot; // no changes made
        }

        const root = new TreeNode(arr.shift());
        const queue = [root];
        while(queue.length > 0 && arr.length > 0) {
            const currNode = queue.shift();
            const leftVal = arr.shift();
            const rightVal = arr.shift();

            if (leftVal !== null && leftVal !== undefined) {
                currNode.left = new TreeNode(leftVal);
                queue.push(currNode.left);
            }
            if (rightVal !== null && rightVal !== undefined) {
                currNode.right = new TreeNode(rightVal);
                queue.push(currNode.right);
            }
        }
        return root;
    };

    const updateTreeArray = (root) => {
        $alertContainer.classList.remove('active');
        if (root === null) {
            document.getElementById('tree-array-input').innerText = '[]';
            return;
        }

        const arr = [root.val];

        // BFS algorithm to create array from tree
        const queue = [root];
        while (queue.length > 0) {
            const node = queue.shift();
            if (node.left) {
                arr.push(node.left.val);
                queue.push(node.left);
            } else {
                arr.push(null);
            }
            if (node.right) {
                arr.push(node.right.val);
                queue.push(node.right);
            } else {
                arr.push(null);
            }
        }

        // trim nulls off the end of the array
        while (arr[arr.length - 1] === null) arr.pop();

        // update input field
        // $treeArrayInput = d3.select('#tree-array-input').node().innerText = JSON.stringify(arr);
        const textBefore = $treeArrayInput.innerText;
        const textAfter = JSON.stringify(arr);
        // toggle class of input field to trigger pulse animation
        if (textBefore !== textAfter) {
            $treeArrayInput.innerText = textAfter;
            $treeArrayInput.classList.toggle('pulse');
            setTimeout(() => {
                $treeArrayInput.classList.toggle('pulse');
            }, 500);
        }
    };

    const renderTreeGraphic = (root) => {
        // Clear contents of display before re-drawing
        const displaySVG = d3.select('#svg-display');
        displaySVG.selectAll('*').remove();
        displaySVG.append('g')
            .attr('id', 'svg-tree');
        const treeSVG = d3.select('#svg-tree');

        const MIN_HORIZ_DIST = 50; // Margin between nodes at deepest level of tree.
        const dy = 100;
        const treeDepth = TreeNode.maxDepth(root);
        const displayCenter = displaySVG.node().getBoundingClientRect().width / 2;

        // empty tree, draw a message
        if (root === null) {
            updateTreeArray(binaryTreeRoot);
            drawEmptyTree(treeSVG, displayCenter, dy);
            return;
        };

        // Calculate the horizontal offset (dx) of child nodes at each depth of the tree.
        // The value of dx is dependent on:
        // 1) The depth of the node, (i + 1)
        // 2) The minimum distance between sibling nodes, MIN_HORIZ_DIST
        // 3) The maximum allowable depth of the tree, MAX_DEPTH_LIMIT
        const dxAtDepth = new Array(treeDepth).fill().map((_, i) => {
            let dx = (MIN_HORIZ_DIST) * (Math.pow(2, treeDepth - 1) / Math.pow(2, i + 1));
            if (treeDepth === MAX_DEPTH_LIMIT) dx /= 2;
            return dx;
        });

        // BFS traverse through tree and create SVG elements
        const queue = [[root, 1, displayCenter, 75, '']]; // [node, depth, x-position, y-position, pathID]
        while (queue.length > 0) {
            const [node, depth, x, y, pathID] = queue.shift();

            // Calculate horizontal offset of child nodes.
            const dx = dxAtDepth[depth - 1];

            // coloration of nodes
            if (node.left) {
                drawNodeBranchSVG(treeSVG, x, y, x-dx, y+dy);
                queue.push([node.left, depth+1, x-dx, y+dy, pathID+'l']);
            } else if (pathID.length + 1 < MAX_DEPTH_LIMIT) {
                drawNewNodeAreaSVG(treeSVG, x, y, x-dx, y+dy, pathID+'l');
            }
            if (node.right) {
                drawNodeBranchSVG(treeSVG, x, y, x+dx, y+dy);
                queue.push([node.right, depth+1, x+dx, y+dy, pathID+'r']);
            } else if (pathID.length + 1 < MAX_DEPTH_LIMIT) {
                drawNewNodeAreaSVG(treeSVG, x, y, x+dx, y+dy, pathID+'r');
            }
            let nodeClasses = 'node' + (!node.left && !node.right ? ' leaf' : ''); 
            drawNodeCircleSVG(treeSVG, x, y, nodeClasses, pathID);
            drawNodeValueSVG(treeSVG, x, y, node.val);
        }
        transformTreeSVG(treeSVG, displaySVG); // center and scale tree

        /**
         * Event Listners:
         * 1) Add a new node
         * 2) Edit a node's value
         * 3) Delete a node
         */
        d3.selectAll('.new-node-area').on('click', e => {
            const path = e.target.id;
            binaryTreeRoot.insert(path, valueGenerator());
            updateTreeArray(binaryTreeRoot);
            renderTreeGraphic(binaryTreeRoot);
        });
        d3.selectAll('.node').on('mouseup', e => {
            if (e.which === 1) {
                drawEditNodeValueField(e.target);
            } else if (e.which === 3) {
                const path = e.target.id;
                if (path === '') { // deleting root node
                    binaryTreeRoot = null;
                } else {
                    binaryTreeRoot.delete(path);
                }
                updateTreeArray(binaryTreeRoot);
                renderTreeGraphic(binaryTreeRoot);
            }
        });
    };

    const drawEmptyTree = (svg, x, y) => {
        const group = svg.append('g')
            .attr('class', 'empty-tree-message-group');
        group.append('text')
            .attr('x', x)
            .attr('y', y)
            .attr('text-anchor', 'middle') // horizontally center text
            .attr('dy', '7') // y offset text
            .text('(empty tree)');
        group.append('text')
            .attr('class', 'empty-tree-message')
            .attr('x', x)
            .attr('y', y + 25)
            .attr('text-anchor', 'middle') // horizontally center text
            .attr('dy', '7') // y offset text
            .text('click to add root node')
        group.on('click', () => {
                binaryTreeRoot = new TreeNode(valueGenerator());
                updateTreeArray(binaryTreeRoot);
                renderTreeGraphic(binaryTreeRoot);
        });
    };

    const drawNodeCircleSVG = (svg, x, y, nodeClasses, pathID) => {
        if ($optionColoredLeafs.checked) nodeClasses += ' colored';
        svg.append('circle')
            .attr('class', nodeClasses)
            .attr('id', pathID)
            .attr('r', 20) // fixed 20px radius
            .attr('cx', x)
            .attr('cy', y);
    };

    const drawNodeValueSVG = (svg, x, y, val) => {
        svg.append('text')
            .attr('class', 'node-val')
            .attr('x', x)
            .attr('y', y)
            .attr('text-anchor', 'middle') // horizontally center text in node
            .attr('dy', '7') // y offset text so it appears in center of node
            .text(val);
    };

    const drawNodeBranchSVG = (svg, x1, y1, x2, y2) => {
        const arrowPoints = [[0, 0], [0, 20], [20, 10]];
        svg.append('line')
            .attr('class', 'branch')
            .attr('x1', x1)
            .attr('y1', y1)
            .attr('x2', x2)
            .attr('y2', y2);
    };

    const drawNewNodeAreaSVG = (svg, x1, y1, x2, y2, id) => {
        const group = svg.append('g')
            .attr('class', $optionShowAddNode.checked ? 'new-node-area visible' : 'new-node-area');

        let x = Math.min(x1, x2);
        if (x1 > x2) x -= 20;
        let width = Math.abs(x1 - x2) + 20;
        
        group.append('rect')
            .attr('class', 'new-node-boundary')
            .attr('id', id)
            .attr('x', x)
            .attr('y', y1)
            .attr('width', width)
            .attr('height', y2 - y1 + 20);
        group.append('line')
            .attr('class', 'branch new-branch')
            .attr('x1', x1)
            .attr('y1', y1)
            .attr('x2', x2)
            .attr('y2', y2);
        group.append('circle')
            .attr('class', 'node new-node')
            .attr('r', 20)
            .attr('cx', x2)
            .attr('cy', y2);
    };

    const drawEditNodeValueField = (target) => {
        const rect = target.getBoundingClientRect();
        const inputContainer = d3.select('#svg-container')
            .append('div')
            .attr('class', 'edit-value-container')
            .style('position', 'absolute')
            .style('width', rect.width+'px')
            .style('height', rect.height+'px')
            .style('left', rect.x+'px')
            .style('top', rect.y+'px');

        const path = target.id;
        const currValue = TreeNode.traverse(binaryTreeRoot, path).val;

        const input = inputContainer.append('input')
            .attr('class', 'edit-value-input');
        input.node().focus();
        input.node().value = currValue;
        input.node().select();

        /**
         * Event listeners:
         * 1. User presses enter -> update node value.
         * 2. User pressese escape -> node value is NOT updated.
         * 3. User clicks outside of field -> update node value.
         */
        let userEscaped = false;
        input.on('keyup', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                input.node().blur();
            } else if (e.key === 'Esc' || e.keyCode === 27) {
                userEscaped = true;
                input.node().blur();
            }
        });
        input.on('blur', () => {
            let newValue = userEscaped ? currValue : input.node().value;
            // parse the new value as a number, if it can be
            if (!isNaN(newValue) && newValue !== '') {
                newValue = parseFloat(newValue);
            }
            TreeNode.traverse(binaryTreeRoot, path).val = newValue;
            inputContainer.remove();
            updateTreeArray(binaryTreeRoot);
            renderTreeGraphic(binaryTreeRoot);
        });
    };

    const transformTreeSVG = (tree, display) => {
        let treeRect = tree.node().getBoundingClientRect();
        const displayRect = display.node().getBoundingClientRect();

        // scale tree
        let scale = 1;
        if (treeRect.width > displayRect.width) {
            scale = Math.max(displayRect.width / treeRect.width * 0.95, 0.5);
        }
        tree.attr('transform', `scale(${scale})`);

        // updated bounding box of scaled tree
        treeRect = tree.node().getBoundingClientRect();

        // center tree horizontally
        const treeCenter = treeRect.x + treeRect.width / 2;
        const displayCenter = displayRect.x + displayRect.width / 2;
        tree.attr('transform', `translate(${displayCenter - treeCenter}, 0) scale(${scale})`);
    };

    const randomBinaryTree = (maxDepth, callback = () => 0) => {
        const root = new TreeNode(callback());
        const rootCopy = root;

        const childProbability = 1;

        const queue = [[root, 1]];
        while (queue.length > 0) {
            const [node, depth] = queue.shift();
            if(Math.random() < childProbability && depth < maxDepth) {
                node.left = new TreeNode(valueGenerator());
                queue.push([node.left, depth + 1]);
            }
            if(Math.random() < childProbability && depth < maxDepth) {
                node.right = new TreeNode(valueGenerator());
                queue.push([node.right, depth + 1]);
            }
        }
        return rootCopy;
    };

    const valueGenerator = () => {
        const radio = document.querySelector('input[name="new-node-choice"]:checked').value;
        if (radio === 'fixed-val') {
            return $optionFixedVal.value; // input field value
        } else if (radio === 'random-string') {
            return Math.random().toString(36).slice(2, 5); // 3-char alphanumeric string
        } else {
            return Math.floor(Math.random() * 100); // random number 0-99
        }
        
    };

    // TREE DATA GLOBAL VARIABLE
    let binaryTreeRoot = null;
    const MAX_DEPTH_LIMIT = 10; // Maximum tree depth set to 6 (63 nodes possible).


    // Using DS.js library to manipulate SVG elements in the DOM. (https://d3js.org/)
    // Create <svg> element and <g> element in which SVG elements will be drawn.
    d3.select('#svg-container')
        .append('svg')
        .attr('id', 'svg-display')
        .append('g')
        .attr('id', 'svg-tree');

    // Get DOM elements: input and button
    const $treeArrayInput = document.getElementById('tree-array-input');
    const $arrayToTreeButton = document.getElementById('array-to-tree');
    const $randomTreeButton = document.getElementById('random-tree');

    // Get DOM elements: collapsible menus
    const $menuItems = document.querySelectorAll('.menu-bar-list-item');
    const $expandIcons = document.querySelectorAll('.expand-icon');
    const $collapsibles = document.querySelectorAll('.collapsible');

    // Get DOM elements: alert message container
    const $alertContainer = document.getElementById('alert-container');

    // Get DOM elements: example tree buttons container
    const $examplesContainer = document.getElementById('examples-container');

    // Get DOM elements: options inputs
    const $optionColoredLeafs = document.getElementById('option-colored-leafs');
    const $optionShowAddNode = document.getElementById('option-show-add-node');
    const $optionFixedVal = document.getElementById('new-node-fixed-val');

    $optionColoredLeafs.addEventListener('change', () => {
        if ($optionColoredLeafs.checked) {
            document.querySelectorAll('.leaf').forEach(e => e.classList.add('colored'));
        } else {
            document.querySelectorAll('.leaf').forEach(e => e.classList.remove('colored'));
        }
    });
    
    $optionShowAddNode.addEventListener('change', () => {
        if ($optionShowAddNode.checked) {
            document.querySelectorAll('.new-node-area').forEach(e => e.classList.add('visible'));
        } else {
            document.querySelectorAll('.new-node-area').forEach(e => e.classList.remove('visible'));
        }
    });

    /**
     * Event Listeners
     */
    // add event listener to array input to detect enter key
    $treeArrayInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            $treeArrayInput.blur(); // prevents a carriage return from actually being input
            binaryTreeRoot = buildTreeFromArrString($treeArrayInput.innerText);
            renderTreeGraphic(binaryTreeRoot);
        }
    });
    $arrayToTreeButton.addEventListener('click', () => {
        binaryTreeRoot = buildTreeFromArrString($treeArrayInput.innerText);
        renderTreeGraphic(binaryTreeRoot);
    });

    $randomTreeButton.addEventListener('click', () => {
        binaryTreeRoot = randomBinaryTree(MAX_DEPTH_LIMIT, valueGenerator); // max depth limit
        updateTreeArray(binaryTreeRoot);
        renderTreeGraphic(binaryTreeRoot);
    });

    $menuItems.forEach(($menuItem, i) => {
        $menuItem.addEventListener('click', () => {
            const alreadyIsActive = $menuItem.classList.contains('active');
            $menuItems.forEach($menuItem => $menuItem.classList.remove('active'));
            $expandIcons.forEach($expandIcon => $expandIcon.classList.remove('active'));
            $collapsibles.forEach($collapsible => $collapsible.classList.remove('active'));
            if (!alreadyIsActive) {
                $menuItem.classList.add('active');
                $expandIcons[i].classList.add('active');
                $collapsibles[i].classList.add('active');
            }
        });
    });

    const exampleTrees = [
        {name: 'null',
        serializedArray: '[]'},
        {name: 'Values in Inorder Traversal',
        serializedArray: '[6,4,8,2,5,7,10,1,3,null,null,null,null,9,11]'},
        {name: 'Values in Preorder Traversal',
        serializedArray: '[1,2,7,3,6,8,9,4,5,null,null,null,null,10,11]'},
        {name: 'Values in Postorder Traversal',
        serializedArray: '[11,5,10,3,4,6,9,1,2,null,null,null,null,7,8]'},
        {name: 'Values in Level-Order Traversal',
        serializedArray: '[1,2,3,4,5,6,7,8,9,null,null,null,null,10,11]'},
    ];

    // Add example tree buttons to DOM inside of examples menu.
    $examplesContainer.innerHTML = exampleTrees.reduce((acc, e) => {
        return acc + `<button class="example-tree">${e.name}</button>`
    }, '');
    
    // Event delegation for example tree buttons
    $examplesContainer.addEventListener('click', e => {
        if (e.target.tagName !== 'BUTTON') return;
        const example = exampleTrees.find(el => el.name === e.target.innerText);
        binaryTreeRoot = buildTreeFromArrString(example.serializedArray);
        updateTreeArray(binaryTreeRoot);
        renderTreeGraphic(binaryTreeRoot);
    });

    // Redraw diagram when user resizes window.
    let throttled = false;
    let delay = 250; // milliseconds
    console.log({window})
    window.addEventListener('resize', () => {
        if (!throttled) {
            console.log('resize')
            renderTreeGraphic(binaryTreeRoot);
            throttled = true;
            setTimeout(() => {
                throttled = false;
            }, delay);
        }
    });

    // Set default treeArrayInput value.
    $treeArrayInput.innerText = '[4,8,15,16,23,null,42]';
    binaryTreeRoot = buildTreeFromArrString($treeArrayInput.innerText);
    renderTreeGraphic(binaryTreeRoot);
};

startApp();