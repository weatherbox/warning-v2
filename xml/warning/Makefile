deploy:
	gcloud functions deploy jma-xml-weather-warning \
		--project=weatherbox-217409 \
		--region=asia-northeast1 \
		--trigger-topic=jma-xml-warning \
		--runtime=nodejs10 \
		--entry-point=handler
