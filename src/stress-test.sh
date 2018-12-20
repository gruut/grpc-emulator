#!/bin/bash
for i in {1..17}
do 
	node tx_generator.js localhost 50051 1 &
		sleep 0.2
done
