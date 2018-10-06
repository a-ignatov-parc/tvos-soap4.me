//
//  ServiceProvider.swift
//  TopShelf
//
//  Created by Egor A. Blinov on 05.10.18.
//  Copyright © 2018 Anton Ignatov. All rights reserved.
//

import Foundation
import TVServices

class ServiceProvider: NSObject, TVTopShelfProvider {

    override init() {
        super.init()
    }

    // MARK: - TVTopShelfProvider protocol

    var topShelfStyle: TVTopShelfContentStyle {
        // Return desired Top Shelf style.
        return .sectioned
    }

    var topShelfItems: [TVContentItem] {
        var ContentItems = [TVContentItem]();
        // let defaults = UserDefaults(suiteName: "group.com.antonignatov.soap4me")
        // let MyTVShowsJSON = defaults?.string(forKey: "MyTVShows")
        // do {
        //     if let data = MyTVShowsJSON,
        //         let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
        //         let blogs = json["blogs"] as? [[String: Any]] {
        //         for blog in blogs {
        //             if let name = blog["name"] as? String {
        //                 names.append(name)
        //             }
        //         }
        //     }
        // } catch {
        //     print("Error deserializing JSON: \(error)")
        // }
        return ContentItems
    }

}

