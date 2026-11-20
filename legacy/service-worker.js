self.addEventListener(
    "activate",
    event => {

        event.waitUntil(
            caches.keys().then(
                keys => {

                    return Promise.all(

                        keys.map(
                            key => {

                                if (
                                    key !== CACHE_NAME
                                ) {
                                    return caches.delete(
                                        key
                                    );
                                }

                            }
                        )

                    );

                }
            )
        );

    }
);