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
        var SectionsItems = [TVContentItem]();
        let defaults = UserDefaults(suiteName: "group.com.antonignatov.soap4me")
        do {
            if let topShelfJSONString = defaults?.string(forKey: "topShelf") {
                print("!!! " + topShelfJSONString)
            }
            if let topShelfJSONString = defaults?.string(forKey: "topShelf"),
                let topShelfJSON = topShelfJSONString.data(using: String.Encoding.utf8, allowLossyConversion: false),
                let json = try JSONSerialization.jsonObject(with: topShelfJSON) as? [String: Any],
                let sections = json["sections"] as? [[String: Any]] {
                for section in sections {
                    if let sectionId = section["id"] as? String,
                       let sectionTitle = section["title"] as? String {
                        let sectionItem = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: sectionId, container: nil)!)
                        sectionItem!.title = sectionTitle

                        var contentItems = [TVContentItem]();
                        if let items = section["items"] as? [[String: Any]] {
                            for item in items {
                                let contentItem = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: item["id"] as! String, container: nil)!)

                                contentItem!.imageURL = URL(string: (item["imageSrc"] as? String)!)
                                contentItem!.imageShape = .poster
//                                contentItem!.displayURL = URL(string: "soap2atv:///" + (item["id"] as? String)!);
                                contentItem!.title = item["title"] as? String
                                contentItems.append(contentItem!)
                            }
                            sectionItem!.topShelfItems = contentItems
                        }

                        SectionsItems.append(sectionItem!)
                    }
                }
            }
        } catch {
            print("Error deserializing JSON: \(error)")
        }
        return SectionsItems
    }

}

