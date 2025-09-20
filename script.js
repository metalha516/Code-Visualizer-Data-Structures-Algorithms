 class CodeVisualizer {
            constructor() {
                this.variables = new Map();
                this.arrays = new Map();
                this.linkedLists = new Map();
                this.doublyLinkedLists = new Map();
                this.circularLinkedLists = new Map();
                this.stacks = new Map();
                this.queues = new Map();
                this.trees = new Map();
                this.currentLine = 0;
                this.codeLines = [];
                this.isStepMode = false;
                
                this.initializeEventListeners();
            }

            initializeEventListeners() {
                document.getElementById('visualizeBtn').addEventListener('click', () => {
                    this.visualizeCode();
                });

                document.getElementById('stepBtn').addEventListener('click', () => {
                    this.stepThroughCode();
                });

                document.getElementById('clearBtn').addEventListener('click', () => {
                    this.clearAll();
                });
            }

            clearAll() {
                this.variables.clear();
                this.arrays.clear();
                this.linkedLists.clear();
                this.doublyLinkedLists.clear();
                this.circularLinkedLists.clear();
                this.stacks.clear();
                this.queues.clear();
                this.trees.clear();
                this.currentLine = 0;
                this.codeLines = [];
                this.isStepMode = false;
                
                const visualArea = document.getElementById('visualizationArea');
                visualArea.innerHTML = `
                    <div style="text-align: center; color: #666; margin-top: 200px; font-size: 18px;">
                        🎯 Your data structures will appear here
                    </div>
                `;
                
                document.getElementById('executionInfo').innerHTML = `
                    <div class="current-line">Ready to visualize your code!</div>
                    <div class="variables-list">Click "Visualize Code" to start...</div>
                `;
            }

            visualizeCode() {
                const code = document.getElementById('codeInput').value;
                this.clearAll();
                this.parseAndExecuteCode(code);
            }

            stepThroughCode() {
                if (!this.isStepMode) {
                    const code = document.getElementById('codeInput').value;
                    this.clearAll();
                    this.codeLines = this.parseCodeIntoLines(code);
                    this.isStepMode = true;
                    this.currentLine = 0;
                }

                if (this.currentLine < this.codeLines.length) {
                    this.executeLine(this.codeLines[this.currentLine]);
                    this.currentLine++;
                    this.updateExecutionInfo();
                } else {
                    this.isStepMode = false;
                    this.updateExecutionInfo('Execution completed!');
                }
            }

            parseCodeIntoLines(code) {
                const lines = code.split('\n').map(line => line.trim());
                console.log("All lines:", lines);
                
                // Find main function and extract its content
                let inMain = false;
                let braceCount = 0;
                const mainLines = [];
                let i = 0;
                
                while (i < lines.length) {
                    const line = lines[i];
                    
                    if (line.includes('main(')) {
                        inMain = true;
                        i++;
                        continue;
                    }
                    
                    if (inMain) {
                        if (line.includes('{')) {
                            braceCount += (line.match(/\{/g) || []).length;
                        }
                        if (line.includes('}')) {
                            braceCount -= (line.match(/\}/g) || []).length;
                        }
                        
                        // Handle for loops specially
                        if (line.match(/^for\s*\(/)) {
                            const forLoopResult = this.parseForLoop(lines, i);
                            mainLines.push(...forLoopResult.lines);
                            i = forLoopResult.nextIndex;
                            continue;
                        }
                        
                        // Skip empty lines, braces, return statement, and output statements
                        if (line && 
                            line !== '{' && 
                            line !== '}' && 
                            !line.includes('return') && 
                            !line.includes('cout') &&
                            !line.includes('printf') &&
                            !line.startsWith('//')) {
                            mainLines.push(line);
                        }
                        
                        // Exit main function when braces balance out
                        if (braceCount === 0 && line.includes('}')) {
                            break;
                        }
                    }
                    i++;
                }
                
                console.log("Main function lines:", mainLines);
                return mainLines;
            }

            parseForLoop(lines, startIndex) {
                const forLine = lines[startIndex];
                const forMatch = forLine.match(/for\s*\(\s*([^;]+);\s*([^;]+);\s*([^)]+)\s*\)/);
                
                if (!forMatch) {
                    return { lines: [], nextIndex: startIndex + 1 };
                }
                
                const [, init, condition, increment] = forMatch;
                const expandedLines = [];
                
                // Add initialization
                if (init.trim()) {
                    expandedLines.push(init.trim());
                }
                
                // Find loop body
                let bodyStartIndex = startIndex + 1;
                let bodyLines = [];
                let braceCount = 0;
                let inBody = false;
                
                for (let i = bodyStartIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    if (line === '{') {
                        inBody = true;
                        braceCount++;
                        continue;
                    }
                    
                    if (line === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            // Parse condition to determine loop iterations
                            const conditionMatch = condition.match(/(\w+)\s*<\s*(\d+)/);
                            if (conditionMatch) {
                                const [, varName, limitStr] = conditionMatch;
                                const limit = parseInt(limitStr);
                                
                                // Simulate loop execution
                                for (let loopVar = 0; loopVar < limit; loopVar++) {
                                    // Set loop variable
                                    expandedLines.push(`${varName} = ${loopVar}`);
                                    // Add body lines with variable substitution
                                    bodyLines.forEach(bodyLine => {
                                        let processedLine = bodyLine.replace(new RegExp(`\\b${varName}\\b`, 'g'), loopVar.toString());
                                        expandedLines.push(processedLine);
                                    });
                                }
                            }
                            return { lines: expandedLines, nextIndex: i + 1 };
                        }
                        continue;
                    }
                    
                    if (inBody && line && !line.startsWith('//')) {
                        bodyLines.push(line);
                    }
                }
                
                return { lines: expandedLines, nextIndex: lines.length };
            }

            parseAndExecuteCode(code) {
                console.log("Original code:", code);
                const lines = this.parseCodeIntoLines(code);
                console.log("Parsed lines:", lines);
                
                try {
                    lines.forEach((line, index) => {
                        this.currentLine = index;
                        console.log(`Executing line ${index}: ${line}`);
                        this.executeLine(line);
                    });
                    this.updateVisualization();
                    this.updateExecutionInfo('Execution completed successfully!');
                } catch (error) {
                    console.error("Error:", error);
                    this.showError(`Error in line ${this.currentLine + 1}: ${error.message}`);
                }
            }

            executeLine(line) {
                line = line.trim();
                if (line.endsWith(';')) {
                    line = line.slice(0, -1);
                }
                
                console.log(`Processing line: "${line}"`);

                // Variable assignment (e.g., x = 90)
                if (line.match(/^\w+\s*=\s*[\w\+\-\*\/\s]+$/)) {
                    console.log("Matched variable assignment");
                    this.parseVariableAssignment(line);
                }
                // Variable declaration with expression (e.g., int z = x+y)
                else if (line.match(/^int\s+\w+\s*=\s*[\w\+\-\*\/\s]+$/)) {
                    console.log("Matched variable declaration with expression");
                    this.parseVariableDeclaration(line);
                }
                // Array declaration without initialization
                else if (line.match(/^int\s+\w+\[\d*\]$/)) {
                    console.log("Matched array declaration");
                    this.parseArrayDeclarationEmpty(line);
                }
                // Array element assignment (e.g., arr[i] = i)
                else if (line.match(/^\w+\[\w+\]\s*=\s*[\w\+\-\*\/\s]+$/)) {
                    console.log("Matched array element assignment");
                    this.parseArrayElementAssignment(line);
                }
                // For loop (extract the body)
                else if (line.match(/^for\s*\(/)) {
                    console.log("Matched for loop");
                    // Skip for now, we'll handle the body separately
                    return;
                }
                // Object instantiation (e.g., LL l1;)
                else if (line.match(/^\w+\s+\w+$/)) {
                    console.log("Matched object instantiation");
                    this.parseObjectInstantiation(line);
                }
                // Array declaration with values
                else if (line.match(/^int\s+\w+\[\d*\]\s*=\s*\{.*\}/)) {
                    console.log("Matched array declaration with values");
                    this.parseArrayDeclaration(line);
                }
                // Object method calls (e.g., l1.push_front(20))
                else if (line.match(/^\w+\.\w+\([^)]*\)/)) {
                    console.log("Matched object method call");
                    this.parseObjectMethodCall(line);
                }
                // Legacy operations for backward compatibility
                else if (line.includes('.add(') || line.includes('.insert(')) {
                    console.log("Matched legacy linked list operation");
                    this.parseLinkedListOperation(line);
                }
                else if (line.includes('.push(')) {
                    console.log("Matched stack push");
                    this.parseStackOperation(line, 'push');
                } 
                else if (line.includes('.pop()')) {
                    console.log("Matched stack pop");
                    this.parseStackOperation(line, 'pop');
                }
                else if (line.includes('.enqueue(')) {
                    console.log("Matched queue enqueue");
                    this.parseQueueOperation(line, 'enqueue');
                } 
                else if (line.includes('.dequeue()')) {
                    console.log("Matched queue dequeue");
                    this.parseQueueOperation(line, 'dequeue');
                }
                else if (line.includes('tree.insert(')) {
                    console.log("Matched tree operation");
                    this.parseTreeOperation(line);
                }
                else {
                    console.log("No match found for line");
                }

                if (this.isStepMode) {
                    this.updateVisualization();
                }
            }

            parseVariableDeclaration(line) {
                const match = line.match(/int\s+(\w+)\s*=\s*(.+)/);
                if (match) {
                    const [, varName, expression] = match;
                    const value = this.evaluateExpression(expression.trim());
                    this.variables.set(varName, value);
                    console.log(`Variable ${varName} = ${value}`);
                }
            }

            parseVariableAssignment(line) {
                const match = line.match(/(\w+)\s*=\s*(.+)/);
                if (match) {
                    const [, varName, expression] = match;
                    const value = this.evaluateExpression(expression.trim());
                    this.variables.set(varName, value);
                    console.log(`Variable ${varName} assigned value ${value}`);
                }
            }

            evaluateExpression(expr) {
                // Handle simple expressions with +, -, *, /
                // Replace variable names with their values
                let processedExpr = expr;
                
                // Replace variables with their values
                for (let [varName, value] of this.variables) {
                    const regex = new RegExp(`\\b${varName}\\b`, 'g');
                    processedExpr = processedExpr.replace(regex, value);
                }
                
                try {
                    // Simple evaluation for basic arithmetic
                    // Security note: In production, use a proper expression parser
                    const result = Function(`"use strict"; return (${processedExpr})`)();
                    return isNaN(result) ? 0 : Math.round(result);
                } catch (e) {
                    console.log(`Failed to evaluate expression: ${expr}`);
                    return 0;
                }
            }

            parseArrayDeclarationEmpty(line) {
                const match = line.match(/int\s+(\w+)\[(\d*)\]/);
                if (match) {
                    const [, arrName, sizeStr] = match;
                    const size = parseInt(sizeStr) || 0;
                    const arr = new Array(size).fill(0);
                    this.arrays.set(arrName, arr);
                    console.log(`Array ${arrName} declared with size ${size}`);
                }
            }

            parseArrayElementAssignment(line) {
                const match = line.match(/(\w+)\[(\w+)\]\s*=\s*(.+)/);
                if (match) {
                    const [, arrName, indexExpr, valueExpr] = match;
                    
                    if (this.arrays.has(arrName)) {
                        const index = this.evaluateExpression(indexExpr);
                        const value = this.evaluateExpression(valueExpr);
                        const arr = this.arrays.get(arrName);
                        
                        if (index >= 0 && index < arr.length) {
                            arr[index] = value;
                            this.arrays.set(arrName, arr);
                            console.log(`Array ${arrName}[${index}] = ${value}`);
                        }
                    }
                }
            }

            parseArrayDeclaration(line) {
                const match = line.match(/int\s+(\w+)\[\d*\]\s*=\s*\{([^}]*)\}/);
                if (match) {
                    const [, arrName, valuesStr] = match;
                    const values = valuesStr.split(',').map(v => parseInt(v.trim()));
                    this.arrays.set(arrName, values);
                }
            }

            parseLinkedListOperation(line) {
                const match = line.match(/(\w+)\.(add|insert)\((\d+)\)/);
                if (match) {
                    const [, listName, operation, value] = match;
                    if (!this.linkedLists.has(listName)) {
                        this.linkedLists.set(listName, []);
                    }
                    this.linkedLists.get(listName).push(parseInt(value));
                }
            }

            parseStackOperation(line, operation) {
                const stackMatch = line.match(/(\w+)\.push\((\d+)\)/);
                const popMatch = line.match(/(\w+)\.pop\(\)/);
                
                if (operation === 'push' && stackMatch) {
                    const [, stackName, value] = stackMatch;
                    if (!this.stacks.has(stackName)) {
                        this.stacks.set(stackName, []);
                    }
                    this.stacks.get(stackName).push(parseInt(value));
                } else if (operation === 'pop' && popMatch) {
                    const [, stackName] = popMatch;
                    if (this.stacks.has(stackName)) {
                        this.stacks.get(stackName).pop();
                    }
                }
            }

            parseQueueOperation(line, operation) {
                const enqueueMatch = line.match(/(\w+)\.enqueue\((\d+)\)/);
                const dequeueMatch = line.match(/(\w+)\.dequeue\(\)/);
                
                if (operation === 'enqueue' && enqueueMatch) {
                    const [, queueName, value] = enqueueMatch;
                    if (!this.queues.has(queueName)) {
                        this.queues.set(queueName, []);
                    }
                    this.queues.get(queueName).push(parseInt(value));
                } else if (operation === 'dequeue' && dequeueMatch) {
                    const [, queueName] = dequeueMatch;
                    if (this.queues.has(queueName)) {
                        this.queues.get(queueName).shift();
                    }
                }
            }

            parseTreeOperation(line) {
                const match = line.match(/(\w+)\.insert\((\d+)\)/);
                if (match) {
                    const [, treeName, value] = match;
                    if (!this.trees.has(treeName)) {
                        this.trees.set(treeName, []);
                    }
                    this.trees.get(treeName).push(parseInt(value));
                }
            }

            parseObjectInstantiation(line) {
                const match = line.match(/^(\w+)\s+(\w+)$/);
                if (match) {
                    const [, className, objectName] = match;
                    console.log(`Creating object: ${objectName} of type ${className}`);
                    
                    // Initialize based on class types
                    if (className === 'LL' || className.toLowerCase().includes('linkedlist') || className.includes('LinkedList')) {
                        this.linkedLists.set(objectName, []);
                        console.log(`Linked list ${objectName} created`);
                    } else if (className === 'DoublyLinkedList' || className.toLowerCase().includes('doubly')) {
                        this.doublyLinkedLists.set(objectName, []);
                        console.log(`Doubly linked list ${objectName} created`);
                    } else if (className === 'CircularLinkedList' || className.toLowerCase().includes('circular')) {
                        this.circularLinkedLists.set(objectName, []);
                        console.log(`Circular linked list ${objectName} created`);
                    } else if (className.toLowerCase().includes('stack')) {
                        this.stacks.set(objectName, []);
                        console.log(`Stack ${objectName} created`);
                    } else if (className.toLowerCase().includes('queue')) {
                        this.queues.set(objectName, []);
                        console.log(`Queue ${objectName} created`);
                    }
                }
            }

            parseObjectMethodCall(line) {
                const match = line.match(/^(\w+)\.(\w+)\(([^)]*)\)/);
                if (match) {
                    const [, objectName, methodName, params] = match;
                    console.log(`Method call: ${objectName}.${methodName}(${params})`);
                    
                    // Parse parameters
                    const paramValues = params ? params.split(',').map(p => {
                        const trimmed = p.trim();
                        return isNaN(trimmed) ? trimmed : parseInt(trimmed);
                    }) : [];
                    
                    console.log(`Parameters:`, paramValues);

                    // Handle doubly linked list operations
                    if (this.doublyLinkedLists.has(objectName)) {
                        console.log(`Handling doubly linked list method for ${objectName}`);
                        this.handleDoublyLinkedListMethod(objectName, methodName, paramValues);
                    }
                    // Handle circular linked list operations
                    else if (this.circularLinkedLists.has(objectName)) {
                        console.log(`Handling circular linked list method for ${objectName}`);
                        this.handleCircularLinkedListMethod(objectName, methodName, paramValues);
                    }
                    // Handle linked list operations
                    else if (this.linkedLists.has(objectName)) {
                        console.log(`Handling linked list method for ${objectName}`);
                        this.handleLinkedListMethod(objectName, methodName, paramValues);
                    }
                    // Handle stack operations
                    else if (this.stacks.has(objectName)) {
                        console.log(`Handling stack method for ${objectName}`);
                        this.handleStackMethod(objectName, methodName, paramValues);
                    }
                    // Handle queue operations
                    else if (this.queues.has(objectName)) {
                        console.log(`Handling queue method for ${objectName}`);
                        this.handleQueueMethod(objectName, methodName, paramValues);
                    }
                    else {
                        console.log(`Object ${objectName} not found in any data structure`);
                    }
                }
            }

            handleLinkedListMethod(objectName, methodName, params) {
                const list = this.linkedLists.get(objectName);
                console.log(`Before ${methodName}:`, [...list]);
                
                switch(methodName) {
                    case 'push_front':
                        if (params.length > 0) {
                            list.unshift(params[0]);
                            console.log(`Added ${params[0]} to front`);
                        }
                        break;
                    case 'push_back':
                        if (params.length > 0) {
                            list.push(params[0]);
                            console.log(`Added ${params[0]} to back`);
                        }
                        break;
                    case 'insert':
                        if (params.length >= 2) {
                            const [value, position] = params;
                            if (position === 0) {
                                list.unshift(value);
                            } else if (position >= list.length) {
                                list.push(value);
                            } else {
                                list.splice(position, 0, value);
                            }
                            console.log(`Inserted ${value} at position ${position}`);
                        }
                        break;
                    case 'pop_front':
                        if (list.length > 0) {
                            const removed = list.shift();
                            console.log(`Removed ${removed} from front`);
                        }
                        break;
                    case 'pop_back':
                        if (list.length > 0) {
                            const removed = list.pop();
                            console.log(`Removed ${removed} from back`);
                        }
                        break;
                    case 'add':
                        if (params.length > 0) {
                            list.push(params[0]);
                            console.log(`Added ${params[0]} to list`);
                        }
                        break;
                }
                
                console.log(`After ${methodName}:`, [...list]);
                this.linkedLists.set(objectName, list);
            }

            handleStackMethod(objectName, methodName, params) {
                const stack = this.stacks.get(objectName);
                
                switch(methodName) {
                    case 'push':
                        if (params.length > 0) {
                            stack.push(params[0]);
                        }
                        break;
                    case 'pop':
                        if (stack.length > 0) {
                            stack.pop();
                        }
                        break;
                }
            }

            handleQueueMethod(objectName, methodName, params) {
                const queue = this.queues.get(objectName);
                
                switch(methodName) {
                    case 'enqueue':
                    case 'push':
                        if (params.length > 0) {
                            queue.push(params[0]);
                        }
                        break;
                    case 'dequeue':
                    case 'pop':
                        if (queue.length > 0) {
                            queue.shift();
                        }
                        break;
                }
            }

            handleDoublyLinkedListMethod(objectName, methodName, params) {
                const list = this.doublyLinkedLists.get(objectName);
                console.log(`Before ${methodName}:`, [...list]);
                
                switch(methodName) {
                    case 'insertAtHead':
                        if (params.length > 0) {
                            list.unshift(params[0]);
                            console.log(`Added ${params[0]} to head`);
                        }
                        break;
                    case 'insertAtTail':
                        if (params.length > 0) {
                            list.push(params[0]);
                            console.log(`Added ${params[0]} to tail`);
                        }
                        break;
                    case 'deleteNode':
                        if (params.length > 0) {
                            const index = list.indexOf(params[0]);
                            if (index > -1) {
                                list.splice(index, 1);
                                console.log(`Deleted ${params[0]} from list`);
                            } else {
                                console.log(`Value ${params[0]} not found`);
                            }
                        }
                        break;
                    case 'displayForward':
                        console.log(`Displaying forward: [${list.join(' -> ')}]`);
                        break;
                    case 'displayBackward':
                        console.log(`Displaying backward: [${list.slice().reverse().join(' -> ')}]`);
                        break;
                }
                
                console.log(`After ${methodName}:`, [...list]);
                this.doublyLinkedLists.set(objectName, list);
            }

            handleCircularLinkedListMethod(objectName, methodName, params) {
                const list = this.circularLinkedLists.get(objectName);
                console.log(`Before ${methodName}:`, [...list]);
                
                switch(methodName) {
                    case 'insertAtHead':
                    case 'insert':
                        if (params.length > 0) {
                            list.unshift(params[0]);
                            console.log(`Added ${params[0]} to head of circular list`);
                        }
                        break;
                    case 'insertAtTail':
                    case 'append':
                        if (params.length > 0) {
                            list.push(params[0]);
                            console.log(`Added ${params[0]} to tail of circular list`);
                        }
                        break;
                    case 'deleteNode':
                    case 'remove':
                        if (params.length > 0) {
                            const index = list.indexOf(params[0]);
                            if (index > -1) {
                                list.splice(index, 1);
                                console.log(`Deleted ${params[0]} from circular list`);
                            } else {
                                console.log(`Value ${params[0]} not found in circular list`);
                            }
                        }
                        break;
                    case 'display':
                        console.log(`Displaying circular list: [${list.join(' -> ')} -> (back to head)]`);
                        break;
                }
                
                console.log(`After ${methodName}:`, [...list]);
                this.circularLinkedLists.set(objectName, list);
            }

            updateVisualization() {
                const visualArea = document.getElementById('visualizationArea');
                let html = '';

                // Render variables
                this.variables.forEach((value, name) => {
                    html += `
                        <div class="variable-box">
                            <div class="variable-name">${name}</div>
                            ${value}
                        </div>
                    `;
                });

                // Render arrays
                this.arrays.forEach((values, name) => {
                    html += `
                        <div style="clear: both; margin-top: 20px;">
                            <div style="font-weight: bold; margin-bottom: 30px; color: #000;">Array: ${name}</div>
                            <div class="array-container">
                                ${values.map((value, index) => `
                                    <div class="array-element">
                                        <div class="array-index">[${index}]</div>
                                        ${value}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });

                // Render doubly linked lists
                this.doublyLinkedLists.forEach((values, name) => {
                    html += `
                        <div style="clear: both; margin-top: 20px;">
                            <div style="font-weight: bold; margin-bottom: 10px; color: #333;">Doubly Linked List: ${name}</div>
                            <div class="doubly-linked-list-container">
                                ${values.map((value, index) => `
                                    <div class="doubly-node">
                                        ${value}
                                        ${index > 0 ? '<div class="left-arrow"></div>' : ''}
                                        ${index < values.length - 1 ? '<div class="right-arrow"></div>' : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });

                // Render circular linked lists
                this.circularLinkedLists.forEach((values, name) => {
                    html += `
                        <div style="clear: both; margin-top: 20px;">
                            <div style="font-weight: bold; margin-bottom: 10px; color: #333;">Circular Linked List: ${name}</div>
                            <div class="circular-linked-list-container">
                                ${values.map((value, index) => `
                                    <div class="circular-node">
                                        ${value}
                                        ${index < values.length - 1 ? '<div class="circular-arrow"></div>' : ''}
                                    </div>
                                `).join('')}
                                ${values.length > 0 ? '<div class="circular-back-arrow"></div>' : ''}
                            </div>
                        </div>
                    `;
                });

                // Render linked lists
                this.linkedLists.forEach((values, name) => {
                    html += `
                        <div style="clear: both; margin-top: 20px;">
                            <div style="font-weight: bold; margin-bottom: 10px; color: #333;">Linked List: ${name}</div>
                            <div class="linked-list-container">
                                ${values.map((value, index) => `
                                    <div class="node">
                                        ${value}
                                        ${index < values.length - 1 ? '<div class="arrow"></div>' : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });

                // Render stacks
                this.stacks.forEach((values, name) => {
                    html += `
                        <div style="clear: both; margin-top: 20px;">
                            <div style="font-weight: bold; margin-bottom: 10px; color: #333;">Stack: ${name}</div>
                            <div class="stack-container">
                                ${values.slice().reverse().map(value => `
                                    <div class="stack-element">${value}</div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });

                // Render queues
                this.queues.forEach((values, name) => {
                    html += `
                        <div style="clear: both; margin-top: 20px;">
                            <div style="font-weight: bold; margin-bottom: 10px; color: #333;">Queue: ${name}</div>
                            <div class="queue-container">
                                <div style="margin-right: 10px; font-size: 12px; color: #666;">FRONT →</div>
                                ${values.map(value => `
                                    <div class="queue-element">${value}</div>
                                `).join('')}
                                <div style="margin-left: 10px; font-size: 12px; color: #666;">← REAR</div>
                            </div>
                        </div>
                    `;
                });

                // Render trees
                this.trees.forEach((values, name) => {
                    html += `
                        <div style="clear: both; margin-top: 20px;">
                            <div style="font-weight: bold; margin-bottom: 10px; color: #333;">Binary Tree: ${name}</div>
                            <div class="tree-container">
                                ${this.renderTree(values)}
                            </div>
                        </div>
                    `;
                });

                if (html === '') {
                    html = `
                        <div style="text-align: center; color: #666; margin-top: 200px; font-size: 18px;">
                            🎯 Your data structures will appear here
                        </div>
                    `;
                }

                visualArea.innerHTML = html;
            }

            renderTree(values) {
                if (values.length === 0) return '';
                
                let html = '';
                let level = 0;
                let levelSize = 1;
                let currentIndex = 0;

                while (currentIndex < values.length) {
                    html += '<div class="tree-level">';
                    
                    for (let i = 0; i < levelSize && currentIndex < values.length; i++) {
                        html += `<div class="tree-node">${values[currentIndex]}</div>`;
                        currentIndex++;
                    }
                    
                    html += '</div>';
                    level++;
                    levelSize *= 2;
                }

                return html;
            }

            updateExecutionInfo(message = null) {
                const executionInfo = document.getElementById('executionInfo');
                const currentLineText = message || (this.isStepMode ? 
                    `Executing line ${this.currentLine}: ${this.codeLines[this.currentLine - 1] || 'Complete'}` :
                    'Code execution completed!');
                
                let variablesText = '';
                if (this.variables.size > 0) {
                    variablesText += '<strong>Variables:</strong> ';
                    variablesText += Array.from(this.variables.entries())
                        .map(([name, value]) => `${name} = ${value}`).join(', ');
                }

                executionInfo.innerHTML = `
                    <div class="current-line">${currentLineText}</div>
                    <div class="variables-list">${variablesText || 'No variables declared yet'}</div>
                `;
            }

            showError(message) {
                const executionInfo = document.getElementById('executionInfo');
                executionInfo.innerHTML = `
                    <div class="error-message">
                        ❌ ${message}
                    </div>
                `;
            }
        }

        // Initialize the visualizer when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            new CodeVisualizer();
        });