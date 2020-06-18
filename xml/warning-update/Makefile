deploy:
	gcloud functions deploy jma-xml-warning-update \
		--project=weatherbox-217409 \
		--region=asia-northeast1 \
		--trigger-topic=jma-xml-warning-update \
		--runtime=nodejs10 \
		--entry-point=handler
